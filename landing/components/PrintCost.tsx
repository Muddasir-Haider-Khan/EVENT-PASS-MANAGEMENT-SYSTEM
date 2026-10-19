'use client';

import { useEffect, useState } from 'react';
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { Reveal } from './Reveal';

const fmt = new Intl.NumberFormat('en-PK');

/** Counts smoothly to the new total whenever an input changes. */
function Rolling({ value }: { value: number }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(value);
  const text = useTransform(mv, (v) => fmt.format(Math.round(v)));
  useEffect(() => {
    if (reduce) {
      mv.set(value);
      return;
    }
    const controls = animate(mv, value, { duration: 0.6, ease: [0.2, 0.8, 0.2, 1] });
    return () => controls.stop();
  }, [value, mv, reduce]);
  return <motion.span>{text}</motion.span>;
}

function Slider({
  id,
  label,
  hint,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (n: number) => void;
}) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <div className="field">
      <div className="field__row">
        <label className="field__label" htmlFor={id}>
          {label}
          <span className="field__hint">{hint}</span>
        </label>
        <span className="field__value">{display}</span>
      </div>
      <input
        id={id}
        className="range"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ ['--fill' as string]: `${fill}%` }}
      />
    </div>
  );
}

export function PrintCost() {
  const [people, setPeople] = useState(400);
  const [unit, setUnit] = useState(300);
  const [reprint, setReprint] = useState(10);
  const [perYear, setPerYear] = useState(2);

  const perEvent = Math.round(people * unit * (1 + reprint / 100));
  const yearly = perEvent * perYear;
  const cards = Math.round(people * (1 + reprint / 100)) * perYear;

  return (
    <section className="section" id="cost" aria-labelledby="cost-title">
      <div className="wrap">
        <Reveal className="section-head">
          <h2 className="h2" id="cost-title">
            Printed passes get used for three days, then thrown away.
          </h2>
          <p className="lede">
            Cards, lanyards, holders and a print run that has to be redone for every late registration. Put in your own
            numbers and see what your society spends on passes nobody keeps.
          </p>
        </Reveal>

        <div className="cost">
          <Reveal className="cost__panel glass">
            <Slider
              id="people"
              label="Delegates and guests"
              hint="Everyone who needs a pass"
              value={people}
              min={50}
              max={3000}
              step={10}
              display={fmt.format(people)}
              onChange={setPeople}
            />
            <div className="field">
              <div className="field__row">
                <label className="field__label" htmlFor="unit">
                  Cost of one printed pass
                  <span className="field__hint">Card, lanyard and holder, from your printer’s quote</span>
                </label>
              </div>
              <div className="money-input">
                <span>PKR</span>
                <input
                  id="unit"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={100000}
                  value={unit}
                  onChange={(e) => setUnit(Math.max(0, Math.min(100000, Number(e.target.value) || 0)))}
                />
              </div>
            </div>
            <Slider
              id="reprint"
              label="Passes reprinted"
              hint="Typos, lost cards, late and changed registrations"
              value={reprint}
              min={0}
              max={40}
              step={1}
              display={`${reprint}%`}
              onChange={setReprint}
            />
            <Slider
              id="peryear"
              label="Events a year"
              hint="Conferences, socials and inter-school events"
              value={perYear}
              min={1}
              max={12}
              step={1}
              display={String(perYear)}
              onChange={setPerYear}
            />
          </Reveal>

          <Reveal className="cost__panel cost__result glass" delay={0.1}>
            <div>
              <div className="cost__big num" aria-live="polite">
                PKR <Rolling value={yearly} />
              </div>
              <p className="cost__caption">
                spent each year on <Rolling value={cards} /> printed passes that end up in a drawer or the bin.
              </p>
            </div>

            <div className="cost__split">
              <div className="cost__cell">
                <div className="cost__cell-label">Printing per event</div>
                <div className="cost__cell-value num">
                  <Rolling value={perEvent} />
                </div>
              </div>
              <div className="cost__cell cost__cell--epms">
                <div className="cost__cell-label">Printing with EPMS</div>
                <div className="cost__cell-value num">0</div>
              </div>
            </div>

            <ul className="cost__list">
              <li>
                <X className="x" size={18} strokeWidth={2.5} aria-hidden="true" />
                Printed passes can be photocopied, swapped and lent to friends.
              </li>
              <li>
                <Check className="ok" size={18} strokeWidth={2.5} aria-hidden="true" />
                An EPMS pass is tied to one person and one event, and a second scan while they’re inside is refused.
              </li>
              <li>
                <Check className="ok" size={18} strokeWidth={2.5} aria-hidden="true" />
                Someone registers late? Approve them and their pass is in their inbox within minutes.
              </li>
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
