import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { sendGroupUpdateNotificationEmail } from '@/lib/resend';

export async function GET() {
  const session = getSession('event_manager');
  if (!session || !session.eventId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [categories, groups, singleParticipants, event] = await Promise.all([
      prisma.participantType.findMany({
        where: { eventId: session.eventId },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, description: true, isGroup: true, groupSize: true },
      }),
      prisma.participantGroup.findMany({
        where: { eventId: session.eventId },
        orderBy: { createdAt: 'desc' },
        include: {
          participantType: { select: { id: true, name: true } },
          members: {
            select: {
              id: true,
              email: true,
              name: true,
              phone: true,
              photoUrl: true,
              participantTypeId: true,
              entryStatus: true,
              participantType: { select: { id: true, name: true } },
            },
          },
          _count: {
            select: { members: true },
          },
        },
      }),
      prisma.participant.findMany({
        where: {
          eventId: session.eventId,
          groupId: null,
        },
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          photoUrl: true,
          participantTypeId: true,
          entryStatus: true,
          participantType: { select: { id: true, name: true } },
        },
      }),
      prisma.event.findUnique({
        where: { id: session.eventId },
        select: { name: true },
      }),
    ]);

    return NextResponse.json({
      categories,
      groups,
      singleParticipants,
      eventName: event?.name || 'Event',
    });
  } catch (error) {
    console.error('Fetch groups error:', error);
    return NextResponse.json({ error: 'Failed to fetch groups data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = getSession('event_manager');
  if (!session || !session.eventId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, participantTypeId, leaderId, memberIds } = await req.json();
    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Group / Delegation name is required' }, { status: 400 });
    }

    const event = await prisma.event.findUnique({
      where: { id: session.eventId },
      select: { name: true },
    });

    const group = await prisma.participantGroup.create({
      data: {
        eventId: session.eventId,
        name: name.trim(),
        participantTypeId: participantTypeId || null,
        leaderId: leaderId || null,
      },
    });

    // If initial member IDs provided, assign them to this new group
    if (Array.isArray(memberIds) && memberIds.length > 0) {
      await prisma.participant.updateMany({
        where: {
          id: { in: memberIds },
          eventId: session.eventId,
        },
        data: {
          groupId: group.id,
          ...(participantTypeId ? { participantTypeId } : {}),
        },
      });

      // Send email notifications asynchronously
      const assignedParticipants = await prisma.participant.findMany({
        where: { id: { in: memberIds } },
        select: { id: true, name: true, email: true },
      });

      for (const p of assignedParticipants) {
        sendGroupUpdateNotificationEmail({
          to: p.email,
          recipientName: p.name || p.email,
          eventName: event?.name || 'Event',
          actionType: 'ASSIGNED',
          groupName: group.name,
          isLeader: p.id === group.leaderId,
        }).catch((err) => console.error('Failed sending group assign email:', err));
      }
    }

    return NextResponse.json({ group }, { status: 201 });
  } catch (error) {
    console.error('Create group error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = getSession('event_manager');
  if (!session || !session.eventId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { action, groupId, participantId, addMemberIds, removeMemberId, targetGroupId, name, leaderId, participantTypeId } = body;

    const event = await prisma.event.findUnique({
      where: { id: session.eventId },
      select: { name: true },
    });
    const eventName = event?.name || 'Event';

    // 1. UPDATE GROUP DETAILS (Name, Leader, ParticipantType)
    if (action === 'update_group_info' && groupId) {
      const existingGroup = await prisma.participantGroup.findFirst({
        where: { id: groupId, eventId: session.eventId },
      });
      if (!existingGroup) {
        return NextResponse.json({ error: 'Group not found' }, { status: 404 });
      }

      const updatedGroup = await prisma.participantGroup.update({
        where: { id: groupId },
        data: {
          ...(name ? { name: name.trim() } : {}),
          ...(leaderId !== undefined ? { leaderId } : {}),
          ...(participantTypeId !== undefined ? { participantTypeId } : {}),
        },
        include: { members: { select: { id: true, name: true, email: true } } },
      });

      // Notify members about updated details
      for (const m of updatedGroup.members) {
        sendGroupUpdateNotificationEmail({
          to: m.email,
          recipientName: m.name || m.email,
          eventName,
          actionType: 'DETAILS_UPDATED',
          groupName: updatedGroup.name,
          isLeader: m.id === updatedGroup.leaderId,
        }).catch((err) => console.error('Failed sending group update email:', err));
      }

      return NextResponse.json({ success: true, group: updatedGroup });
    }

    // 2. ADD MEMBER(S) TO GROUP
    if (action === 'add_members' && groupId && Array.isArray(addMemberIds)) {
      const group = await prisma.participantGroup.findFirst({
        where: { id: groupId, eventId: session.eventId },
      });
      if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });

      await prisma.participant.updateMany({
        where: { id: { in: addMemberIds }, eventId: session.eventId },
        data: { groupId },
      });

      const added = await prisma.participant.findMany({
        where: { id: { in: addMemberIds } },
        select: { id: true, name: true, email: true },
      });

      for (const m of added) {
        sendGroupUpdateNotificationEmail({
          to: m.email,
          recipientName: m.name || m.email,
          eventName,
          actionType: 'ASSIGNED',
          groupName: group.name,
          isLeader: m.id === group.leaderId,
        }).catch((err) => console.error('Failed sending group assign email:', err));
      }

      return NextResponse.json({ success: true });
    }

    // 3. REMOVE MEMBER FROM GROUP
    if (action === 'remove_member' && removeMemberId) {
      const participant = await prisma.participant.findFirst({
        where: { id: removeMemberId, eventId: session.eventId },
        include: { group: true },
      });
      if (!participant) return NextResponse.json({ error: 'Participant not found' }, { status: 404 });

      const prevGroupName = participant.group?.name;

      await prisma.participant.update({
        where: { id: removeMemberId },
        data: { groupId: null },
      });

      sendGroupUpdateNotificationEmail({
        to: participant.email,
        recipientName: participant.name || participant.email,
        eventName,
        actionType: 'REMOVED',
        groupName: prevGroupName,
      }).catch((err) => console.error('Failed sending group removal email:', err));

      return NextResponse.json({ success: true });
    }

    // 4. MOVE MEMBER TO ANOTHER GROUP OR SINGLE
    if (action === 'move_member' && participantId) {
      const participant = await prisma.participant.findFirst({
        where: { id: participantId, eventId: session.eventId },
      });
      if (!participant) return NextResponse.json({ error: 'Participant not found' }, { status: 404 });

      let targetGroup = null;
      if (targetGroupId) {
        targetGroup = await prisma.participantGroup.findFirst({
          where: { id: targetGroupId, eventId: session.eventId },
        });
      }

      await prisma.participant.update({
        where: { id: participantId },
        data: { groupId: targetGroupId || null },
      });

      sendGroupUpdateNotificationEmail({
        to: participant.email,
        recipientName: participant.name || participant.email,
        eventName,
        actionType: targetGroup ? 'TRANSFERRED' : 'REMOVED',
        groupName: targetGroup?.name,
        isLeader: targetGroup ? participantId === targetGroup.leaderId : false,
      }).catch((err) => console.error('Failed sending group move email:', err));

      return NextResponse.json({ success: true });
    }

    // LEGACY / DIRECT PARTICIPANT UPDATE
    if (participantId) {
      const participant = await prisma.participant.findFirst({
        where: { id: participantId, eventId: session.eventId },
      });
      if (!participant) return NextResponse.json({ error: 'Participant not found' }, { status: 404 });

      const updatedParticipant = await prisma.participant.update({
        where: { id: participantId },
        data: { groupId: groupId || null },
      });

      if (groupId && body.isLeader) {
        await prisma.participantGroup.update({
          where: { id: groupId },
          data: { leaderId: participantId },
        });
      }

      return NextResponse.json({ success: true, participant: updatedParticipant });
    }

    return NextResponse.json({ error: 'Invalid request payload' }, { status: 400 });
  } catch (error) {
    console.error('Update group error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = getSession('event_manager');
  if (!session || !session.eventId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Group ID is required' }, { status: 400 });
    }

    const group = await prisma.participantGroup.findFirst({
      where: { id, eventId: session.eventId },
      include: { members: { select: { id: true, name: true, email: true } } },
    });

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 });
    }

    const event = await prisma.event.findUnique({
      where: { id: session.eventId },
      select: { name: true },
    });

    // Detach all members
    await prisma.participant.updateMany({
      where: { groupId: id },
      data: { groupId: null },
    });

    // Delete group
    await prisma.participantGroup.delete({
      where: { id },
    });

    // Notify former members
    for (const m of group.members) {
      sendGroupUpdateNotificationEmail({
        to: m.email,
        recipientName: m.name || m.email,
        eventName: event?.name || 'Event',
        actionType: 'REMOVED',
        groupName: group.name,
      }).catch((err) => console.error('Failed sending dissolution email:', err));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete group error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
