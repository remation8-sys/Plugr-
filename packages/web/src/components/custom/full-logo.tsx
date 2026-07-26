const FullLogo = () => {
  return (
    <div className="flex h-[60px] items-center gap-2.5">
      <img
        className="h-9 w-auto"
        src="/plugr-icon.png"
        alt="Plugr"
        width="36"
        height="36"
        loading="eager"
        decoding="async"
      />
      <span className="text-2xl font-bold tracking-tight text-foreground">
        Plugr
      </span>
    </div>
  );
};
FullLogo.displayName = 'FullLogo';
export { FullLogo };
