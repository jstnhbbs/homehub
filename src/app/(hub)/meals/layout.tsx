import { MealsSubNav } from "@/components/meals-sub-nav";

export default function MealsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MealsSubNav />
      {children}
    </>
  );
}
