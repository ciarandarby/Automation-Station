/* 

Notion brought out their own amazing calendar app that syncs with Google Calendar.
As a Notion geek, I had to have my events automatically display in some of my pages.
For some reason, their calendar app cannot integrate linked calendars to your Notion databases; enter this script.

This is FREE, there are many services out there that charge subscriptions for something this simple and do not work as well.
Without relying on third-party apps, your data is safe and not exposed outside of your own Google and Notion accounts.

To do this is quite simple, first you need an integration token from Notion. So, just create a free private integration:
https://developers.notion.com/docs/create-a-notion-integration

Then make a database with a calendar view, ensure it marked as accessible by the integration in the access tab within the integration's page.

The database must have these properties, the exact titles are required for the script to work:
- Name (type: Title)
- Date (type: Date) 
- GCAL ID (type: Text)
- Status (type: Text)
- Description (type: Text)
- Location (type: Text)
- Event Link (type: URL)

If the properties are not inputted within the Notion UI calendar view, the API server will return errors and the script will fail, we need therse to show all of the
event info. I purposly did not add in logic to check this as we'll use console logs for error debugging as it's the only real way log background execution failures in app scripts
adding dedicated function would be redundant here.

Using your browser, go to the database and copy the database ID from the URL - That's pretty much it from the Notion side of things. Pretty simple right?

Here's the fun part, I'll outline this in steps for what to do on the Google side. 

1. Go to drive.google.com

2. Create a new Google App Script, just like you'd create a sheet or doc - If you haven't used App Scripts yet, welcome to your new life! It's a great, free tool that provides an
IDE, hosts websites, apps, API executibles, Google Workspace extensions along with nice features like log history, hidden properities and even triggers.
It supports JavaScript (Google Script), HTML and CSS. 

3. In the settings, go to Script Properities, this is where you will add the Notion token and Notion database ID - treat these like passwords or API keys (they pretty much are).

4. In the file Code.gs, paste in the below code and save it.

5. Run the code, examine the logs, make any changes to ensure it connects successfully. You will be asked for authorization; this is only so the code can read your calendar.

6. Once successfully ran and in your Notion page, create a trigger in the trigger tab for whatever interval of time you want.

That's all! The code has some additional cool features: 

-Recognizes Zoom links
-Adds locations
-Converts HTML tags from the calendar extraction to Notion's styling, so <p> not every line looks like this<p/>
-Does not copy over any email adresses of other people in an invite, no risk of adding people to a new event
-Edits event if anything changes
-Does not duplicate
-A fallback for overriding 'ForceResyncAllEvents. This is great for when you delete in Notion and want a fresh sync. If you delete items in the database, it will still register them
when in trash which is where this comes in to start fresh without having to manually delete them one by one from trash.
-Does 7 days in advance - this is a good middleground, too long might timeout the script execution.
-It's free

*/

const NOTION_KEY = PropertiesService.getScriptProperties().getProperty('Notion Integration'); // Here are the two secrets you should put in script properities
const NOTION_DATABASE_ID = PropertiesService.getScriptProperties().getProperty('Database ID');
const NOTION_API_VERSION = '2022-06-28';
const CALENDAR_ID = 'primary'; // This is your primary Google Calendar in the same Google Account this script is hosted. This can be set manually

function syncCalendarToNotion() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const lastSync = scriptProperties.getProperty('lastSync');
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  const syncOptions = {
    timeMin: now.toISOString(),
    timeMax: sevenDaysFromNow.toISOString(), 
    updatedMin: lastSync ? new Date(lastSync).toISOString() : null,
    showDeleted: true,
    singleEvents: true,
    orderBy: 'startTime', 
    maxResults: 100 
  };

  let pageToken;
  let events;
  let totalProcessed = 0;
  
  console.log(`Syncing events from ${now.toDateString()} to ${sevenDaysFromNow.toDateString()}`);
  
  do {
    syncOptions.pageToken = pageToken;
    try {
      events = Calendar.Events.list(CALENDAR_ID, syncOptions);
    } catch (e) {
      console.error('Error fetching Google Calendar events: ' + e.toString());
      return;
    }

    if (events.items && events.items.length > 0) {
      events.items.forEach(event => {
        const eventStart = new Date(event.start?.dateTime || event.start?.date);
        if (eventStart < now || eventStart > sevenDaysFromNow) {
          console.log(`Skipping event outside 7-day window: ${event.summary} (${eventStart.toDateString()})`);
          return; 
        }
        
        if (event.status === 'cancelled') {
          deleteNotionPage(event.id);
        } else {
          createOrUpdateNotionPage(event);
          totalProcessed++;
        }
      });
    }
    
    pageToken = events.nextPageToken;
  } while (pageToken);

  scriptProperties.setProperty('lastSync', now.toISOString());
  console.log(`Sync completed successfully. Processed ${totalProcessed} events within the next 7 days.`);
}

function getNotionPageIdByGCalId(gcalId) {
  const queryPayload = {
    filter: {
      property: "GCAL ID",
      rich_text: {
        equals: gcalId,
      },
    },
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: buildNotionHeaders(),
    payload: JSON.stringify(queryPayload),
    muteHttpExceptions: true 
  };

  try {
    const url = `https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`;
    console.log(`Querying URL: ${url}`);
    const response = UrlFetchApp.fetch(url, options);
    const responseText = response.getContentText();

    if (response.getResponseCode() !== 200) {
      console.error(`Notion API error: ${responseText}`);
      return null;
    }
    
    const results = JSON.parse(responseText);
    if (results.results && results.results.length > 0) {
      return results.results[0].id;
    }
  } catch (e) {
    console.error(`Error querying Notion for GCAL ID ${gcalId}: ${e.toString()}`);
  }
  return null;
}

function createOrUpdateNotionPage(event) {
  const existingPageId = getNotionPageIdByGCalId(event.id);
  
  if (existingPageId) {
    console.log(`Updating existing page for event: ${event.summary}`);
    updateExistingNotionPage(existingPageId, event);
  } else {
    console.log(`Creating new page for event: ${event.summary}`);
    createNewNotionPage(event);
  }
}

function createNewNotionPage(event) {
  const notionPayload = buildNotionPayload(event, null);
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: buildNotionHeaders(),
    payload: JSON.stringify(notionPayload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch('https://api.notion.com/v1/pages', options);
    const responseText = response.getContentText();
    
    if (response.getResponseCode() !== 200) {
      console.error(`Failed to create page: ${responseText}`);
    } else {
      console.log(`Successfully created page for event: ${event.summary}`);
    }
  } catch (e) {
    console.error(`Error creating Notion page for event ${event.summary}: ${e.toString()}`);
  }
}

function updateExistingNotionPage(pageId, event) {
  const notionPayload = buildNotionPayload(event, pageId);
  
  const options = {
    method: 'patch',
    contentType: 'application/json',
    headers: buildNotionHeaders(),
    payload: JSON.stringify(notionPayload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(`https://api.notion.com/v1/pages/${pageId}`, options);
    const responseText = response.getContentText();
    
    if (response.getResponseCode() !== 200) {
      console.error(`Failed to update page: ${responseText}`);
    } else {
      console.log(`Successfully updated page for event: ${event.summary}`);
    }
  } catch (e) {
    console.error(`Error updating Notion page for event ${event.summary}: ${e.toString()}`);
  }
}

function deleteNotionPage(gcalId) {
  const pageId = getNotionPageIdByGCalId(gcalId);
  if (!pageId) {
    console.log(`No Notion page found for GCAL ID ${gcalId}, skipping deletion.`);
    return;
  }

  const options = {
    method: 'patch',
    contentType: 'application/json',
    headers: buildNotionHeaders(),
    payload: JSON.stringify({ archived: true }),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(`https://api.notion.com/v1/pages/${pageId}`, options);
    if (response.getResponseCode() === 200) {
      console.log(`Successfully archived Notion page for GCAL ID ${gcalId}`);
    }
  } catch (e) {
    console.error(`Error archiving Notion page for GCAL ID ${gcalId}: ${e.toString()}`);
  }
}

function buildNotionHeaders() {
  return {
    'Authorization': 'Bearer ' + NOTION_KEY,
    'Notion-Version': NOTION_API_VERSION,
    'Content-Type': 'application/json',
  };
}

function buildNotionPayload(event, pageId) {
  const properties = {
    "Name": { "title": [{ "text": { "content": event.summary || "No Title" } }] },
    "GCAL ID": { "rich_text": [{ "text": { "content": event.id } }] },
    "Status": { "rich_text": [{ "text": { "content": event.status || "confirmed" } }] },
  };

  if (event.start) {
    properties["Date"] = {
      "date": {
        "start": event.start.dateTime || event.start.date,
        "end": event.end ? (event.end.dateTime || event.end.date) : (event.start.dateTime || event.start.date)
      }
    };
  }

  if (event.description) {
    let cleanDescription = event.description
      .replace(/<br\s*\/?>/gi, '\n') 
      .replace(/<\/p>/gi, '\n\n') 
      .replace(/<\/li>/gi, '\n') 
      .replace(/<[^>]*>/g, '') 
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&') 
      .replace(/&lt;/g, '<') 
      .replace(/&gt;/g, '>') 
      .replace(/&quot;/g, '"') 
      .replace(/&#39;/g, "'") 
      .replace(/\n{3,}/g, '\n\n') 
      .trim();
    
    properties["Description"] = { "rich_text": [{ "text": { "content": cleanDescription.substring(0, 2000) } }] };
  }

  if (event.location) {
    properties["Location"] = { "rich_text": [{ "text": { "content": event.location } }] };
  }

  let zoomLink = null;

  if (event.conferenceData && event.conferenceData.entryPoints) {
    const videoEntry = event.conferenceData.entryPoints.find(entry => 
      entry.entryPointType === 'video' && entry.uri
    );
    if (videoEntry && videoEntry.uri.includes('zoom')) {
      zoomLink = videoEntry.uri;
    }
  }
  
  if (!zoomLink && event.description) {
    let searchableDesc = event.description
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
    
    const zoomPatterns = [
      /https?:\/\/[a-zA-Z0-9\-\.]*zoom\.us\/j\/\d+[^\s<>"']*/gi,
      /https?:\/\/[a-zA-Z0-9\-\.]*zoom\.us\/[^\s<>"']*\/\d{9,11}[^\s<>"']*/gi,
      /https?:\/\/[a-zA-Z0-9\-\.]*zoom\.us\/my\/[^\s<>"']*/gi,
      /https?:\/\/[a-zA-Z0-9\-\.]*zoom\.us\/[ws]\/\d+[^\s<>"']*/gi
    ];
    
    for (const pattern of zoomPatterns) {
      const match = searchableDesc.match(pattern);
      if (match) {
        zoomLink = match[0]
          .replace(/[<>"\s]+$/, '') 
          .replace(/&amp;/g, '&'); 
        break;
      }
    }
  }
  
  if (!zoomLink && event.location) {
    const locationZoomMatch = event.location.match(/https?:\/\/[a-zA-Z0-9\-\.]*zoom\.us\/[^\s]*/i);
    if (locationZoomMatch) {
      zoomLink = locationZoomMatch[0];
    }
  }
  
  if (!zoomLink && event.hangoutLink) {
    if (event.hangoutLink.includes('zoom')) {
      zoomLink = event.hangoutLink;
    }
  }
  
  if (zoomLink) {
    if (!zoomLink.startsWith('http://') && !zoomLink.startsWith('https://')) {
      zoomLink = 'https://' + zoomLink;
    }
    properties["Event Link"] = { "url": zoomLink };
    console.log(`Found Zoom link for ${event.summary}: ${zoomLink}`);
  } else if (event.description && event.description.toLowerCase().includes('zoom')) {
    console.log(`Event "${event.summary}" mentions Zoom but couldn't extract link`);
  }

  const payload = { properties: properties };
  if (!pageId) {
    payload.parent = { "database_id": NOTION_DATABASE_ID };
  }
  
  return payload;
}

function testNotionConnection() {
  const options = {
    method: 'get',
    headers: buildNotionHeaders(),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}`, options);
    const responseText = response.getContentText();
    
    if (response.getResponseCode() === 200) {
      const database = JSON.parse(responseText);
      console.log(`Successfully connected to database: ${database.title[0]?.plain_text || 'Untitled'}`);
      console.log('Database properties:', Object.keys(database.properties));
      return true;
    } else {
      console.error(`Failed to connect to database: ${responseText}`);
      return false;
    }
  } catch (e) {
    console.error(`Error testing connection: ${e.toString()}`);
    return false;
  }
}

function forceResyncAllEvents() {
  const now = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
  
  const syncOptions = {
    timeMin: now.toISOString(),
    timeMax: sevenDaysFromNow.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 250
  };

  console.log(`Force resyncing events from ${now.toDateString()} to ${sevenDaysFromNow.toDateString()}`);

  try {
    const events = Calendar.Events.list(CALENDAR_ID, syncOptions);
    
    if (events.items && events.items.length > 0) {
      console.log(`Found ${events.items.length} events to resync`);
      
      events.items.forEach(event => {
        if (event.status !== 'cancelled') {
          console.log(`Creating fresh page for: ${event.summary}`);
          createNewNotionPage(event);
        }
      });
      
      console.log(`Force resync completed. Created ${events.items.length} new pages.`);
    } else {
      console.log('No events found in the 7-day window');
    }
  } catch (e) {
    console.error(`Error during force resync: ${e.toString()}`);
  }
}

function clearAllSyncedEvents() {
  const queryPayload = {
    filter: {
      property: "GCAL ID",
      rich_text: {
        is_not_empty: true
      }
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    headers: buildNotionHeaders(),
    payload: JSON.stringify(queryPayload),
    muteHttpExceptions: true
  };

  try {
    const response = UrlFetchApp.fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, options);
    const results = JSON.parse(response.getContentText());
    
    if (results.results && results.results.length > 0) {
      console.log(`Found ${results.results.length} synced events to archive`);
      
      results.results.forEach(page => {
        const archiveOptions = {
          method: 'patch',
          contentType: 'application/json',
          headers: buildNotionHeaders(),
          payload: JSON.stringify({ archived: true }),
          muteHttpExceptions: true
        };
        
        UrlFetchApp.fetch(`https://api.notion.com/v1/pages/${page.id}`, archiveOptions);
        console.log(`Archived: ${page.properties.Name?.title[0]?.text?.content || 'Unnamed'}`);
      });
      
      console.log('All synced events have been archived. Empty the trash in Notion to permanently delete.');
    } else {
      console.log('No synced events found to clear');
    }
  } catch (e) {
    console.error(`Error clearing events: ${e.toString()}`);
  }
}

function syncSpecificDateRange(startDate, endDate) {
  const syncOptions = {
    timeMin: new Date(startDate).toISOString(),
    timeMax: new Date(endDate).toISOString(),
    singleEvents: true,
    orderBy: 'startTime'
  };

  try {
    const events = Calendar.Events.list(CALENDAR_ID, syncOptions);
    
    if (events.items && events.items.length > 0) {
      console.log(`Found ${events.items.length} events in date range`);
      events.items.forEach(event => {
        if (event.status !== 'cancelled') {
          createOrUpdateNotionPage(event);
        }
      });
    } else {
      console.log('No events found in specified date range');
    }
  } catch (e) {
    console.error(`Error syncing date range: ${e.toString()}`);
  }
}

function setSyncWindowDays(days) {
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty('syncWindowDays', days.toString());
  console.log(`Sync window set to ${days} days`);
}

function getSyncWindowDays() {
  const scriptProperties = PropertiesService.getScriptProperties();
  const days = scriptProperties.getProperty('syncWindowDays');
  return days ? parseInt(days) : 7;
}