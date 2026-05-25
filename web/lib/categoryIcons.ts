// Emoji glyphs for the built-in categories. Custom categories carry their own `icon`
// column on `CustomCategory`; this map covers the defaults and the Uncategorized bucket.

export const BUILTIN_CATEGORY_ICONS: Record<string, string> = {
  Income: "💰",
  Food: "🍽️",
  Transport: "🚆",
  Bills: "📄",
  Shopping: "🛍️",
  Uncategorized: "❓",
};

export const DEFAULT_CATEGORY_ICON = "🏷️";

// Curated emoji set the in-app picker offers. Keep it small and personal-finance flavoured.
export const CATEGORY_ICON_CHOICES: string[] = [
  "🏷️", "💰", "🍽️", "🚆", "📄", "🛍️", "🏠", "💡", "🎉", "🎁",
  "🩺", "✈️", "🎓", "🐾", "👶", "💪", "💻", "📚", "🎨", "🎮",
  "🍷", "☕", "🧘", "🚗", "⛽", "🅿️", "🚲", "📱", "🧾", "💳",
];

export function iconFor(category: string | null | undefined, customIcons: Record<string, string | null | undefined>): string {
  if (!category) return BUILTIN_CATEGORY_ICONS.Uncategorized;
  const custom = customIcons[category];
  if (custom) return custom;
  return BUILTIN_CATEGORY_ICONS[category] ?? DEFAULT_CATEGORY_ICON;
}
