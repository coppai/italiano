import { forwardRef } from 'react';

const AnswerInput = forwardRef(function AnswerInput(
  { value, onChange, onSubmit, placeholder = 'you got this...', style },
  ref
) {
  return (
    <input
      ref={ref}
      type="text"
      autoComplete="off"
      placeholder={placeholder}
      value={value}
      onChange={e => onChange(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onSubmit();
        }
      }}
      style={style}
    />
  );
});

export default AnswerInput;
