const FullLogo = () => {
  return (
    <div className="flex h-[60px] items-center gap-2.5">
      <img className="h-9 w-auto" src="/logo.svg" alt="Plugr" />
      <span className="text-2xl font-bold tracking-tight text-foreground">
        Plugr
      </span>
    </div>
  );
};
FullLogo.displayName = 'FullLogo';
export { FullLogo };
