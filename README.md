🧹 URL Cleaner

A lightweight, privacy-focused Chrome extension that automatically removes tracking parameters from URLs. Protect your browsing privacy and prevent cross-site tracking with zero configuration.

✨ Features
🔒 Automatic Cleaning – Strips tracking parameters before pages load
📋 Clean on Copy – Automatically cleans URLs when you copy them
🖱️ Hover Preview – See tracking parameters before clicking links
🎯 Smart Detection – Recognizes 200+ tracking parameters from all major platforms
⚡ Zero Config – Works immediately with sensible defaults
🛠️ Customizable – Add your own blocked parameters and whitelist sites
📊 Privacy Stats – Track how many trackers you've blocked
🆓 Completely Free – No ads, no data collection, open source

Supported Platforms
| Platform             | Parameters Stripped         |
| -------------------- | --------------------------- |
| Google Analytics     | `utm_*` (all variants)      |
| Facebook/Meta        | `fbclid`, `fb_*`            |
| Google Ads           | `gclid`, `gclsrc`, `dclid`  |
| Microsoft            | `msclkid`                   |
| TikTok               | `ttclid`                    |
| Twitter/X            | `twclid`, `t`, `s`          |
| Instagram            | `igshid`                    |
| LinkedIn             | `li_fat_id`                 |
| Pinterest            | `epik`, `pk_*`              |
| Amazon               | `psc`, `pd_rd_*`, `pf_rd_*` |
| YouTube              | `feature`, `app`            |
| Spotify              | `si`, `context`             |
| + 50+ more platforms | See rules.js                |

🚀 Installation
From Chrome Web Store (Recommended)
1. Visit URL Cleaner on Chrome Web Store (link coming soon)
2. Click "Add to Chrome"
3. Done! The extension works immediately

From Source (Developer Mode)
1. Download or clone this repository:
git clone https://github.com/yourusername/url-cleaner.git
2. Open Chrome and navigate to chrome://extensions/
3. Enable Developer mode (toggle in top-right corner)
4. Click Load unpacked
5. Select the url-cleaner folder
6. The extension icon 🧹 will appear in your toolbar

📖 How to Use
Automatic Cleaning (Default)
Just browse normally. URL Cleaner automatically removes tracking parameters when you:
1. Click links with tracking codes
2. Navigate to URLs with UTM parameters
3. Copy links from the address bar

Manual Cleaning
Method 1: Current Page
1. Click the 🧹 icon in your toolbar
2. Click "Clean This Page"
3. The page reloads with a clean URL

Method 2: Copy Clean Link
1. Right-click any link on a webpage
2. Select "Copy Clean Link (No Tracking)"
3. Paste the clean URL anywhere

Method 3: Hover Preview
1. Hover over any link to see if it contains tracking parameters
2. A tooltip shows which parameters will be removed

Viewing Your Impact
1. Total URLs cleaned – Lifetime count
2. Total parameters removed – All-time blocked trackers
3. Last cleaned – Most recent URL with removed parameters
4. Activity log – History of cleaned URLs (last 100)

⚙️ Settings
Click the 🧹 icon → toggle settings:
| Setting             | Description                                 | Default |
| ------------------- | ------------------------------------------- | ------- |
| Extension Enabled   | Master on/off switch                        | On      |
| Clean on navigation | Auto-clean when loading pages               | On      |
| Clean when copying  | Auto-clean copied URLs                      | On      |
| Aggressive mode     | Use pattern matching to catch more trackers | Off     |
| Show notifications  | Display toast when cleaning                 | On      |

Custom Parameters
Add your own tracking parameters to block:
1. Open the popup
2. Scroll to "Custom Parameters"
3. Type the parameter name (e.g., my_tracker)
4. Click +

Whitelist Sites
URL Cleaner automatically disables itself on analytics dashboards and ad platforms (Google Analytics, Facebook Ads Manager, etc.) so you don't break your work tools.

🏗️ Project Structure
url-cleaner/
├── manifest.json          # Extension configuration
├── background.js          # Service worker - URL cleaning engine
├── content.js             # Content script - Clipboard & UI
├── popup.html             # Extension popup UI
├── popup.js               # Popup logic
├── popup.css              # Styling
├── rules.js               # Tracking parameters database (200+ params)
├── rules.json             # Declarative net request rules
├── icons/                 # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md              # This file

🔧 Technical Details
How It Works
1. Navigation Intercept – webNavigation.onBeforeNavigate catches URLs before page loads
2. Parameter Detection – Checks against database of 200+ known tracking parameters
3. URL Rewriting – Removes tracking params and redirects to clean URL
4. Clipboard Monitor – Cleans URLs when you copy them (optional)
5. Visual Feedback – Shows badge count and notifications

Privacy & Security
1. No external network requests – All cleaning happens locally
2. No data collection – Stats stored only in your browser
3. No analytics/telemetry – We don't track you
4. Open source – Full transparency, auditable code
5. Minimal permissions – Only requests what's necessary

Permissions Used
| Permission            | Purpose                         |
| --------------------- | ------------------------------- |
| declarativeNetRequest | Intercept and modify URLs       |
| storage               | Save settings and stats locally |
| activeTab             | Clean current page on request   |
| clipboardWrite        | Copy clean links                |
| contextMenus          | Right-click "Copy Clean Link"   |
| host_permissions      | Work on all websites            |

🛠️ Development
git clone https://github.com/yourusername/url-cleaner.git
cd url-cleaner
Load in Chrome (see Installation section) → Make changes → Reload extension in chrome://extensions/

Adding New Tracking Parameters
Edit rules.js and add to TRACKING_PARAMS array:
const TRACKING_PARAMS = [
  // ... existing params
  'new_tracker',      // Add new parameter
  'another_tracker',  // Another one
];

Testing
1. Visit a URL with tracking: https://example.com?utm_source=test&fbclid=123
2. Check that it redirects to: https://example.com
3. Verify the badge shows parameter count
4. Check popup shows "Last Cleaned" section

Building for Production
Create distribution zip:
zip -r url-cleaner.zip url-cleaner/ -x "*.git*" "*.DS_Store" "*.md" "screenshots/*"

🤝 Contributing
1. Fork the repository
2. Create a branch (git checkout -b feature/amazing-feature)
3. Commit changes (git commit -m 'Add amazing feature')
4. Push to branch (git push origin feature/amazing-feature)
5. Open a Pull Request

Contribution Ideas
1. Firefox/Edge port
2. Import/export custom rules
3. Per-site settings
4. Keyboard shortcuts
5. Dark mode for popup
6. More comprehensive tracking parameter database

Reporting Issues
Please include:
1. Chrome version (chrome://version/)
2. URL that wasn't cleaned properly (or example)
3. Screenshot of popup showing the issue
4. Steps to reproduce

📋 Changelog
1. Initial release
2. 200+ tracking parameters supported
3. Auto-clean on navigation and copy
4. Hover preview tooltips
5. Context menu integration
6. Privacy stats and activity log
7. Custom parameter support

📝 License
MIT License – see LICENSE file for details.


Made with ❤️ & 🔒 for a more private web
