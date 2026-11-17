import { NextResponse } from "next/server";
import { client } from "@/sanity/lib/client";
import { PROJECTS_QUERY } from "@/sanity/lib/queries";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const projects = await client.fetch(PROJECTS_QUERY, {}, { perspective: "published" });
    return NextResponse.json(projects);
  } catch (error) {
    console.error("Erreur lors du chargement des projets Sanity :", error);
    return NextResponse.json({ error: "Chargement des projets indisponible" }, { status: 502 });
  }
}
