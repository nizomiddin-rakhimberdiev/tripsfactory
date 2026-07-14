/**
 * Premium is "another world": the data-theme attribute swaps every design
 * token (dark surfaces, gold accents, serif display type) for this subtree.
 */
export default function PremiumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div data-theme="premium" className="bg-background text-foreground">
      {children}
    </div>
  );
}
