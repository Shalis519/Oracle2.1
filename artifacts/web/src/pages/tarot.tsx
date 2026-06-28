export default function TarotPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 rounded-full bg-card border border-border flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(179,155,200,0.2)]">
        <div className="w-12 h-12 border-2 border-secondary rotate-45 flex items-center justify-center">
          <div className="w-6 h-6 border border-primary -rotate-45" />
        </div>
      </div>
      <h1 className="text-4xl font-serif font-bold mb-4">Таро</h1>
      <p className="text-xl text-muted-foreground max-w-md">
        Раздел находится в разработке. Карты тасуются, значения формируются. Скоро здесь появится полноценный расклад.
      </p>
    </div>
  );
}
