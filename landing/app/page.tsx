import QRCode from 'qrcode';
import { Nav } from '@/components/Nav';
import { Hero } from '@/components/Hero';
import { Ticker } from '@/components/Ticker';
import { PrintCost } from '@/components/PrintCost';
import { AudienceSwitch } from '@/components/AudienceSwitch';
import { Flow } from '@/components/Flow';
import { GateSimulator } from '@/components/GateSimulator';
import { Capabilities } from '@/components/Capabilities';
import { Trust } from '@/components/Trust';
import { Faq } from '@/components/Faq';
import { Enquiry } from '@/components/Enquiry';
import { Footer } from '@/components/Footer';
import { WhatsAppFloat } from '@/components/WhatsAppFloat';
import { audienceLink } from '@/lib/site';

export default async function Page() {
  // The QR on the hero pass is real: scanning it opens a chat with 27 Media.
  const qrSvg = await QRCode.toString(audienceLink('general'), {
    type: 'svg',
    margin: 0,
    errorCorrectionLevel: 'M',
    color: { dark: '#0B1222', light: '#00000000' },
  });

  return (
    <>
      <Nav />
      <main id="main">
        <Hero qrSvg={qrSvg} />
        <Ticker />
        <PrintCost />
        <AudienceSwitch />
        <Flow />
        <GateSimulator />
        <Capabilities />
        <Trust />
        <Faq />
        <Enquiry />
      </main>
      <Footer />
      <WhatsAppFloat />
    </>
  );
}
