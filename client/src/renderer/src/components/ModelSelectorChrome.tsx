import { BLUE, NAVY, TEAL, monoFont } from '../theme'

/**
 * Visual chrome shared between ModelSelector and the add-custom-form view.
 * Wordmark is the MedLifeSim logo; TealBar is the 3px accent strip at the
 * top of every card (matches the ProfileSelector card).
 */
export function Wordmark() {
  return (
    <p
      style={{
        fontFamily: monoFont,
        fontWeight: 700,
        fontSize: 20,
        letterSpacing: '0.04em',
        color: BLUE,
        margin: 0,
      }}
    >
      <span style={{ color: NAVY }}>MedLife</span>Sim
    </p>
  )
}

export function TealBar() {
  return <div style={{ height: 3, background: TEAL, borderRadius: '4px 4px 0 0' }} />
}
