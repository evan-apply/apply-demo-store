import {useProductOptions} from '@shopify/hydrogen';

export default function ProductOptions() {
  const {options, setSelectedOption, selectedOptions} = useProductOptions();

  return (
    <>
      {options.map(({name, values}) => (
        <fieldset key={name} style={{marginBottom: '20px', border: 'none', padding: 0}}>
          <legend style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#9D9A93',
            marginBottom: '10px',
            display: 'block',
          }}>
            {name}
          </legend>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px'}}>
            {values.map((value) => {
              const checked = selectedOptions[name] === value;
              const id = `option-${name}-${value}`;
              return (
                <label key={id} htmlFor={id} style={{cursor: 'pointer'}}>
                  <input className="sr-only" type="radio" id={id}
                    name={`option[${name}]`} value={value}
                    checked={checked}
                    onChange={() => setSelectedOption(name, value)}
                  />
                  <div style={{
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 500,
                    letterSpacing: '0.04em',
                    border: checked ? '1.5px solid #282A33' : '1px solid #E5E7EB',
                    backgroundColor: checked ? '#282A33' : '#FFFFFF',
                    color: checked ? '#FFFFFF' : '#282A33',
                    borderRadius: '3px',
                    transition: 'all 0.15s ease',
                    cursor: 'pointer',
                  }}>
                    {value}
                  </div>
                </label>
              );
            })}
          </div>
        </fieldset>
      ))}
    </>
  );
}
