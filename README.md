# SFI College Unit Website

A static website for the Students' Federation of India (SFI) College Unit at RIT, featuring a modern design with glassmorphism effects, responsive layout, and multilingual support.

## Features

- **Responsive Design**: Optimized for desktop and mobile devices.
- **Glassmorphism UI**: Modern card-based layout with backdrop blur effects.
- **Multilingual Support**: Includes Malayalam text with proper font rendering.
- **Static Site**: No build process required, pure HTML and CSS.

## Deployment on Vercel

Vercel makes it easy to deploy this static site. Follow these steps:

1. **Prepare Your Repository**:
   - Ensure all files (`home.html`, `style.css` if separate, and `75026.jpg`) are in your GitHub repository.
   - The `style.css` is embedded in `home.html`, so no separate file is needed.

2. **Deploy to Vercel**:
   - Go to [Vercel](https://vercel.com) and sign in with your GitHub account.
   - Click "New Project".
   - Import your GitHub repository containing this project.
   - Vercel will automatically detect it as a static HTML site.
   - Configure the build settings if needed (usually not required for static HTML).
   - Click "Deploy".

3. **Access Your Site**:
   - Once deployed, Vercel will provide a live URL (e.g., `https://your-project.vercel.app`).
   - Your site is now live!

## Local Development

To view the site locally:

1. Clone the repository: `git clone <your-repo-url>`
2. Navigate to the project directory: `cd sfi`
3. Open `home.html` directly in your browser, or use a local server:
   - Python: `python -m http.server 8000` (then visit `http://localhost:8000`)
   - Node.js: Install `serve` globally (`npm install -g serve`) and run `serve .`

## File Structure

- `home.html`: Main HTML file with embedded CSS and content.
- `75026.jpg`: Background image (ensure this file is present for the background to display).

## Customization

- Edit `home.html` to update content, colors, or layout.
- Change the background image by replacing `75026.jpg`.
- Modify CSS variables in `:root` for color themes.

## License

This project is open-source. Feel free to use and modify as needed.