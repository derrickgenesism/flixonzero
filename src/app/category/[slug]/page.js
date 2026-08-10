import { redirect } from 'next/navigation';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const name = decodeURIComponent(slug);
  return {
    title: `${name} — Flixon`,
    description: `Browse all ${name} movies and series on Flixon.`
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  // Redirect to homepage which now properly handles all categories and pagination
  redirect(`/?category=${slug}`);
}
