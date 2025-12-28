# Geometry Dash Level Tracker

A simple, responsive web application for tracking approved copies of Geometry Dash levels with real-time search functionality.

## Features

- 🔍 **Search Functionality**: Search levels by name, creator, ID, or description
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- 🎨 **Modern UI**: Clean, gradient-based design with smooth animations
- 📊 **Dynamic Data**: Loads level data from a JSON file that can be updated easily
- ⚡ **Fast & Lightweight**: Pure HTML, CSS, and JavaScript - no frameworks required

## Files Structure

```
.
├── index.html      # Main HTML structure
├── styles.css      # Styling and responsive design
├── script.js       # Search functionality and data loading
├── levels.json     # Level data (update this file to add/modify levels)
└── README.md       # This file
```

## JSON Data Format

The `levels.json` file should contain an array of level objects with the following structure:

```json
[
    {
        "id": 1,
        "name": "Level Name",
        "creator": "Creator Name",
        "status": "approved",
        "description": "Optional description"
    }
]
```

**Fields:**
- `id` (number): Unique identifier for the level
- `name` (string): Name of the level
- `creator` (string): Creator's name
- `status` (string): Either "approved" or "pending"
- `description` (string, optional): Additional information about the level

## Deployment to GitHub Pages

### Method 1: Using GitHub Web Interface

1. **Create a GitHub repository** (or use an existing one)
2. **Upload all files** to the repository:
   - `index.html`
   - `styles.css`
   - `script.js`
   - `levels.json`
3. **Go to repository Settings**
4. **Navigate to Pages** (in the left sidebar)
5. **Under "Source"**, select the branch containing your files (usually `main` or `master`)
6. **Select the folder** (usually `/ (root)`)
7. **Click Save**
8. Your site will be available at `https://[username].github.io/[repository-name]`

### Method 2: Using Git Command Line

1. **Initialize git repository** (if not already done):
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```

2. **Create a GitHub repository** and add it as remote:
   ```bash
   git remote add origin https://github.com/[username]/[repository-name].git
   git branch -M main
   git push -u origin main
   ```

3. **Enable GitHub Pages**:
   - Go to your repository on GitHub
   - Settings → Pages
   - Select branch `main` and folder `/ (root)`
   - Click Save

## Updating Level Data

To update the level data:

1. Edit the `levels.json` file
2. Commit and push the changes:
   ```bash
   git add levels.json
   git commit -m "Update levels data"
   git push
   ```
3. The changes will be reflected on your GitHub Pages site automatically (may take a few minutes)

## Local Development

To test the site locally:

1. **Using a local server** (recommended):
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   
   # Node.js (with http-server)
   npx http-server
   ```

2. **Open in browser**: Navigate to `http://localhost:8000`

**Note**: Opening `index.html` directly in a browser may cause CORS issues when loading `levels.json`. Using a local server is recommended.

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

See LICENSE file for details.
