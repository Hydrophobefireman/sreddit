export function BackButton({ onClick }) {
  return (
    <button class="backbutton" onClick={onClick}>
      <svg viewBox="0 0 24 24" class="hoverable" height={40} width={40}>
        <path fill="none" d="M0 0h24v24H0z" />
        <path fill="#fff" d="M16.01 11H4v2h12.01v3L20 12l-3.99-4z" />
      </svg>
    </button>
  );
}
