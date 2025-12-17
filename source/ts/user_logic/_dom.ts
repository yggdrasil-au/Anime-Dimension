// DOM helpers for the user page

export const qs = (sel: string, root: ParentNode = document): HTMLElement | null => root.querySelector(sel) as HTMLElement | null;

export const byId = (id: string): HTMLElement | null => document.getElementById(id);

