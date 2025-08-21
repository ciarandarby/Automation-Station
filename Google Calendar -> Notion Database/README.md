Google Calendar -> Notion Database
An Apps Script to automatically sync Google Calendar events into a Notion database.
Free, fast, simple and secure.

Notion brought out their own amazing calendar app that syncs with Google Calendar. As a Notion geek, I had to have my events automatically display in some of my pages. For some reason, their calendar app cannot integrate linked calendars to your Notion databases; enter this script.

This is FREE, there are many services out there that charge subscriptions for something this simple and do not work as well. Without relying on third-party apps, your data is safe and not exposed outside of your own Google and Notion accounts.

Setup Instructions
Part 1: Notion Setup

To do this is quite simple, first you need an integration token from Notion. So, just create a free private integration:
https://developers.notion.com/docs/create-a-notion-integration

Then make a database with a calendar view, ensure it is marked as accessible by the integration in the access tab within the integration's page. Using your browser, go to the database and copy the database ID from the URL - That's pretty much it from the Notion side of things. Pretty simple right?

Part 2: Google Apps Script Setup

Here's the fun part, I'll outline this in steps for what to do on the Google side.

Go to drive.google.com.

Create a new Google App Script, just like you'd create a sheet or doc.

If you haven't used App Scripts yet, welcome to your new life! It's a great, free tool that provides an IDE, hosts websites, apps, API executibles, Google Workspace extensions along with nice features like log history, hidden properities and even triggers. It supports JavaScript (Google Script), HTML and CSS.

In the settings, go to Script Properties. This is where you will add the Notion token and Notion database ID - treat these like passwords or API keys (they pretty much are).

In the file Code.gs, paste in the code and save it.

Run the code, examine the logs, make any changes to ensure it connects successfully. You will be asked for authorization; this is only so the code can read your calendar.

Once successfully ran and in your Notion page, create a trigger in the trigger tab for whatever interval of time you want.

That's all!

Features
The code has some additional cool features:

Recognizes Zoom links

Adds locations

Converts HTML tags from the calendar extraction to Notion's styling, so <p> not every line looks **like this<strong/><p/>`

Does not copy over any email adresses of other people in an invite, no risk of adding people to a new event

Edits event if anything changes

Does not duplicate

A fallback for overriding ForceResyncAllEvents. This is great for when you delete in Notion and want a fresh sync. If you delete items in the database, it will still register them when in trash which is where this comes in to start fresh without having to manually delete them one by one from trash.

Does 7 days in advance - this is a good middleground, too long might timeout the script execution.

It's free