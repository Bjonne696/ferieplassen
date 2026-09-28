import React, { useId, useState } from 'react';

export default function Tooltip({ children, text, icon = "?", id: suppliedId }) {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const generatedId = useId();
  const tooltipId = suppliedId || `${generatedId}-tooltip`;

  return (
    <span
      className="tooltip"
      onMouseEnter={() => {
        setHovered(true);
        setDismissed(false);
        setVisible(true);
      }}
      onMouseLeave={() => {
        setHovered(false);
        setVisible(focused && !dismissed);
      }}
      onFocus={() => {
        setFocused(true);
        setDismissed(false);
        setVisible(true);
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setFocused(false);
          setVisible(hovered && !dismissed);
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && visible) {
          setDismissed(true);
          setVisible(false);
        }
      }}
    >
      {children}
      <button className="tooltip__icon" type="button" aria-label="Hjelpetekst" aria-describedby={tooltipId}
        aria-expanded={visible} aria-controls={tooltipId}
        onClick={() => {
          setDismissed(false);
          setVisible(true);
        }}>
        {icon}
      </button>
      <span className={`tooltip__content${visible ? ' is-visible' : ''}`} id={tooltipId} role="tooltip">
        {text}
      </span>
    </span>
  );
}
