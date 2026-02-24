# Deployment Guide: Tasslim Parts Manager (cPanel)

Follow these steps to host your application live on cPanel.

## 1. Prepare Your Files
- Zip the following files/folders from your project root:
  - `index.html`, `inventory.html`, `pos.html`, `issue-part.html`, `login.html`, etc.
  - `css/` folder
  - `js/` folder
  - `.htaccess`
- (Optional) If you want the modern interface, include the `frontend` folder (built).

## 2. Upload Frontend to cPanel
1. Login to **cPanel**.
2. Open **File Manager**.
3. Navigate to `public_html`.
4. Click **Upload** and select your zip file.
5. Once uploaded, right-click the zip and select **Extract**.

## 3. Setup MySQL Database
1. Go to **cPanel > MySQL® Databases**.
2. Create a new database (e.g., `youruser_spare_parts`).
3. Create a new database user and a strong password.
4. **Add User to Database** with "All Privileges".
5. Go to **phpMyAdmin** in cPanel.
6. Select your new database and click **Import**.
7. Choose the `backend/database/schema.sql` file from your computer and click **Go**.

## 4. Setup Node.js Backend
1. In cPanel, search for **Setup Node.js App**.
2. Click **Create Application**.
3. **Node.js version**: Select 18.x or 20.x.
4. **Application mode**: Production.
5. **Application root**: `backend`.
6. **Application URL**: `api` (or your preferred subpath).
7. **Application startup file**: `dist/server.js` (Run `npm run build` locally before uploading the `backend` folder).
8. Click **Create**.
9. Once created, add **Environment Variables** for:
   - `DB_HOST`: localhost
   - `DB_USER`: (your database user)
   - `DB_PASSWORD`: (your database password)
   - `DB_NAME`: (your database name)
   - `PORT`: (leave blank or set to 3000)

## 5. Update Connection URLs
If your legacy app needs to talk to the live API:
1. Open `js/app.js` in the cPanel File Manager.
2. Ensure any API URLs point to `https://yourdomain.com/api` instead of `localhost`.

---
**Need Help?** Contact your hosting support or check the cPanel Node.js documentation.
