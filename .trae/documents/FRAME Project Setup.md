# Project Setup & PhotoFrame Implementation

## Completed Tasks

1. **Project Initialization**

   * Initialized Next.js project (App Router).

   * *Note: Due to environment limitations (Node 16.5), used Next.js 13 with experimental App Router which mirrors Next.js 14 architecture.*

   * Configured TypeScript, Tailwind CSS, and ESLint.

2. **Design System Setup**

   * **Colors**: Set global background to `#050505` and text to white.

   * **Fonts**: integrated 'Cinzel' (Serif) and 'Lato' (Sans) via Google Fonts.

   * **Global Styles**: Applied in `globals.css` and `tailwind.config.ts`.

3. **PhotoFrame Component**

   * **Matte Board**: Off-white (`#F2F2F0`) with responsive padding (`p-4` to `p-16`).

   * **Texture**: Applied subtle SVG noise overlay.

   * **Depth**: Implemented dual-layer shadows:

     * Inner shadow on image for "recessed" look.

     * Deep drop shadow on matte for "lifted" look.

   * **Caption**: Centered, uppercase serif typography.

4. **Exhibition Page**

   * Created a responsive gallery layout displaying 3 frames (Landscape, Portrait, Square).

   * Used high-quality Unsplash placeholders.

## Verification

* **Server Status**: Development server running at `http://localhost:3000`.

* **Preview**: Validated successful render (despite minor hydration warning due to font loading method in older Next.js version).

