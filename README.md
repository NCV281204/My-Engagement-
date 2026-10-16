# Khmer Engagement Invitation (ពិធីភ្ជាប់ពាក្យ)

Plain HTML, CSS and JavaScript. Nothing to install.

## Edit
1. Open this folder in VS Code (File > Open Folder).
2. Change names, date, time, venue and map in `config.js`. For the map, open your venue in Google Maps on a computer, copy the long link from the address bar, and paste it into `mapLink`. The map on the page and the "មើលក្នុង Google Map" button both follow that one link. Short links such as `maps.app.goo.gl/...` cannot be shown inside the page.
3. Add your own pictures to the `images/` folder, using these exact names:
   - `background.jpg` (your photo behind the whole invitation and the opening screen; a portrait photo about 1080 px wide, under 500 KB)
   - `B1.JPG` (landscape picture behind the opening screen; keep the capital letters exactly, a wide photo about 1920 px, under 600 KB)
   - `photo1.jpg` to `photo4.jpg` (gallery)
   - `khqr.png` (your KHQR code)
   Empty slots show a gold placeholder until you add the file.
4. Personal links: `index.html?guest=ឈ្មោះភ្ញៀវ` shows that name on the cover.
5. **Music:** when a guest taps *Open invitation*, the page plays `music/music.mp3` on a loop (it also finds `music.mp3` next to `index.html`). If neither file is found, a built-in music-box tune plays instead. To use your own song, put it in the `music` folder and name it `music.mp3` (under about 3 MB, and only use music you have the right to use). The gold round button pauses or resumes it.
6. **Digital tickets:** open `guests.html`, type your live invitation address, paste one guest name per line, and click *Make tickets*. Each guest gets a ticket picture with the couple's photo, names, date, their own name and a QR code. Scanning the QR code opens the invitation with their name on the cover. Use *Download ticket* to save the picture, *Share* to send it (on a phone it opens the share sheet, on a computer it opens Telegram), or *Print tickets*. The ticket photo is `images/ticket.jpg` if you add one, otherwise `images/background.jpg`. Open the page from your website or Live Server, not by double-clicking the file. Do not upload a guest list to GitHub.
7. Preview with the **Live Server** extension (right-click `index.html` > Open with Live Server).

## Upload to GitHub
```bash
git init
git add .
git commit -m "Add engagement invitation"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/engagement-invitation.git
git push -u origin main
```

## Publish as a web page
GitHub: **Settings > Pages > Deploy from a branch > main / (root) > Save**.
Live at `https://YOUR-USERNAME.github.io/engagement-invitation/`.
