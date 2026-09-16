import { Card } from "@lepid-labs/ui-react";

export function Guide() {
  return (
    <div className="guide">
      <Card>
        <h2 className="section-title">
          <span className="section-num">05</span>Measuring
        </h2>
        <ul>
          <li>Gap is the number of blocks from one axle to the next; the front axle is the reference.</li>
          <li>Between is the number of blocks between the two bearings on an axle: 0 if they touch.</li>
          <li>
            Wheel size sets the track. Each bearing is one block and a wheel's center sits half a wheel
            outboard of its bearing, so track = between + 2 + wheel width (small 1, big 2).
          </li>
          <li>
            A fixed axle that sits off the turn-center line scrubs its tires in every turn; the results warn
            when that happens.
          </li>
        </ul>
      </Card>
      <Card>
        <h2 className="section-title">
          <span className="section-num">06</span>Entering the limits
        </h2>
        <ol>
          <li>Upgrade the Driver's Seat to Level 5 and connect it to every steering bearing.</li>
          <li>Aim the Connect Tool at a bearing and press E to open its settings.</li>
          <li>Enter that wheel's left-turn and right-turn limits from the table.</li>
          <li>Repeat for each wheel, then test at low speed.</li>
          <li>If a wheel turns the wrong way, reverse that bearing's connection with the Connect Tool.</li>
        </ol>
      </Card>
      <Card>
        <h2 className="section-title">
          <span className="section-num">07</span>The math
        </h2>
        <pre className="ld-pre">{`R      = T/2 + L / tan(inner)     (reference axle)
inner  = atan(L / (R - T/2))
outer  = atan(L / (R + T/2))`}</pre>
        <dl>
          <dt>R</dt>
          <dd>turn radius, turn center to vehicle centerline</dd>
          <dt>L</dt>
          <dd>distance from the axle to the turn-center line</dd>
          <dt>T</dt>
          <dd>that axle's track: between + 2 + wheel width</dd>
        </dl>
        <p style={{ marginTop: "var(--ld-space-2)" }}>
          Every wheel rolls on a circle around one turn center, so the inner wheel always turns farther than
          the outer one, and axles farther from the center turn more. Axles behind the center steer reversed.
        </p>
      </Card>
    </div>
  );
}
