import os
import re

DIR = 'c:/Users/AFAQE/.gemini/antigravity/scratch/academy-platform/js/pages'

for filename in os.listdir(DIR):
    if filename.endswith(".js"):
        filepath = os.path.join(DIR, filename)
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # We need to change: Router.register('...', function(container) {
        # to: Router.register('...', async function(container) {
        content = re.sub(
            r"Router\.register\('([^']+)',\s*function\s*\(([^)]+)\)\s*\{",
            r"Router.register('\1', async function(\2) {",
            content
        )
        
        # Replace DB.get calls with await DB.get
        # Note: If there are calls like DB.getSomething() inside map() or filter(), this will break.
        # e.g.  DB.getStudents().slice(0,6).map(s => { const family = DB.getFamily(s.familyId); ... })
        # This occurs in admin-dashboard.js!
        
        # We need to carefully handle those. Perhaps it's better to manually rewrite data.js instead?
        # Actually, if we just await all the basic lists at the top of the function:
        # We can extract all DB.get* calls, fetch them asynchronously, and then inject them?
        
        # Let's just output the files that contain "DB."
        print(f"File {filename} contains DB: { 'DB.' in content }")

