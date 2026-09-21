# @voxtelesys/n8n-nodes-voxtelesys

This is an n8n community node. It lets you send , and RCS messages with Voxtelesys in your n8n workflows.


[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  
[Compatibility](#compatibility)  
[Usage](#usage)  
[Resources](#resources)  
[Version history](#version-history)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

You can install this package using npm:

```bash
npm install @voxtelesys/n8n-nodes-voxtelesys
```

## Operations

This node supports the following resources and operations:

### Message

- **Send**: Sends an SMS or MMS message

### RCS Message

- **Send**: Sends an RCS message as text, a file, a card or a carousel, optionally with suggestion chips and SMS/MMS failover

## Credentials

To use this node, you need to authenticate with the Voxtelesys API using your OAuth2 Credentials.

### Prerequisites

1. Sign up for a [Voxtelesys account](https://portal.voxtelesys.net)
2. Navigate to your [OAuth](https://portal.voxtelesys.net/oauth) in the Voxtelesys Portal
3. Create your OAuth Client. This defaults to using Voxtelesys as the Identity Provider, but if you have your own you can register it in the `Providers` tab first.
4. Assign the relevant scopes for your client
5. Copy your Client ID and Secret ID

### Setting up credentials in n8n

1. In n8n, go to **Credentials** and create new credentials
2. Search for "Voxtelesys OAuth2 API" and select it
3. Enter your Client ID and Client Secret in their respective **Client ID** and **Client Secret** fields
4. Test the credentials to ensure they work correctly

For more information about Voxtelesys's OAuth2, refer to the [official documentation](https://developer.voxtelesys.com/apis/authorization#oauth-20).

## Compatibility

- Developed and tested against n8n 2.x (2.37.10). Earlier versions are untested and unsupported.

This node is built using n8n's programmatic-style node architecture and follows the latest n8n development best practices.

## Usage

### Prerequisites
To send SMS and MMS messages, you must have an SMS enabled number.
See: https://voxtelesys.com/tutorial/the-campaign-registry for more details.

To send RCS messages, you must have a registered RCS agent, whose name is the **From** value on the send. Sending also needs the `rcsapi:rcs:manage` scope on the OAuth client, which is separate from the messaging scopes — a client set up only for SMS will not be able to send RCS.

### Send an SMS

Add the **Voxtelesys** node, select the **Message** resource and the **Send** operation, then fill in:

| Field | Example |
| --- | --- |
| **From** | `+13003003000` |
| **To** | `+13003003001` |
| **Message** | `Your order has shipped.` |

**From** and **To** take [E.164](https://en.wikipedia.org/wiki/E.164) numbers — a plus sign, country code, then subscriber number, with no spaces, dashes or parentheses. Loosely formatted numbers such as `(300) 555-0100` are accepted as long as **Normalize Numbers to E.164** is left enabled under **Options**.

To send to a number from an earlier node, put an expression in **To**:

```
{{ $json.phoneNumber }}
```

### Send an MMS

An MMS is a send that carries media. Under **Options**, add **Media URLs** and enter one publicly reachable URL per entry:

```
https://example.com/receipt.png
```

**Message** is still required — an MMS with media but no body is rejected. Use one entry per URL; an expression returning an array of URLs is not accepted, but an expression resolving to a single URL is:

```
{{ $json.imageUrl }}
```

### Send an RCS message

RCS is a richer channel than SMS: the message can carry media, rich cards and tappable suggestion chips, and falls back to SMS for recipients whose phone or carrier cannot receive it.

Add the **Voxtelesys** node, select the **RCS Message** resource, and the **Send** operation. Then fill in:

| Field | Example |
| --- | --- |
| **From** | `Brand` |
| **To** | `+13003003001` |
| **Content Type** | `Text` |
| **Message** | `Your order has shipped.` |

**From** is the registered sender for your RCS agent, not a phone number — RCS messages are sent as a brand. **To** takes an E.164 number, the same as messaging, and **Normalize Numbers to E.164** under **Options** applies here too.

### Choose a content type

**Content Type** decides what the message carries, and the node shows only the fields that type needs. **Suggestions**, **SMS Failover** and **Options** apply to all four.

| Content Type | Carries | Fields |
| --- | --- | --- |
| **Text** | A plain text message | **Message** (max 1600 characters) |
| **File** | An image, video, audio file or PDF on its own | **File URL** (max 15 MB), **Thumbnail URL** (max 100 KB) |
| **Card** | One rich card | **Orientation**, **Alignment**, and the **Card** itself |
| **Carousel** | Between 2 and 10 rich cards the recipient scrolls through | **Card Width**, and the **Cards** |

A card, whether on its own or in a carousel, takes:

| Field | Notes |
| --- | --- |
| **Title** | Max 200 characters |
| **Description** | Max 1600 characters |
| **Media URL** | Image or video, max 15 MB |
| **Media Height** | `Short`, `Medium` or `Tall`, once a media URL is set |
| **Media Thumbnail URL** | Max 100 KB, once a media URL is set |
| **Suggestions** | Up to 4, shown on the card rather than under the message |

A card is only rendered when it has a **Title**, a **Media URL**, or both — a description on its own is not enough, and the node rejects the send rather than letting the API drop the card.

For a single card, **Orientation** places the media beside the text (`Horizontal`) or above it (`Vertical`), and **Alignment** puts the content on the `Left` or the `Right`. A carousel instead sets **Card Width** once for every card in it.

### Add suggestions

**Suggestions** are the chips shown with the message, up to 11 of them. A card carries its own list too, up to 4 per card, shown on the card rather than under the message. Every chip has **Text** (max 25 characters - what the recipient sees) and **Callback Data** (max 2048 characters - data sent back when clicked). The **Type** then decides what tapping it does, and the node only shows the fields that type needs:

| Type | What it does | Extra fields |
| --- | --- | --- |
| **Reply** | Sends the chip's text back as a reply | — |
| **Open URL** | Opens a URL | **URL**, **Application** (`Browser` or `Webview`), **View Mode** when a webview |
| **Dial Phone** | Opens the dialer with a number | **Phone Number** |
| **Show Location** | Opens a map at a point | **Latitude**, **Longitude**, **Label** |
| **Request Location** | Asks the recipient to share their location | — |
| **Create Calendar Event** | Prefills a new calendar event | **Title**, **Start Time**, **End Time**, **Description** |

A confirmation prompt is two Reply chips:

| Type | Text | Callback Data |
| --- | --- | --- |
| Reply | `Confirm` | `confirm-{{ $json.orderId }}` |
| Reply | `Reschedule` | `reschedule-{{ $json.orderId }}` |

The tapped chip's callback data arrives on the inbound message, so branch on it in the workflow that handles your inbound webhook.

### Fall back to SMS

Not every recipient can receive RCS. Turn on **SMS Failover** and Voxtelesys sends an SMS or MMS message instead when RCS delivery is not possible.

**Failover From** is required and must be an SMS enabled number, because the RCS **From** is an agent rather than a number. Under **Failover Options**:

- **To** defaults to the RCS recipient — set it only to send the fallback somewhere else
- **Message** defaults to the RCS message body, and is required for a file, card or carousel, since none of those have a body to fall back on. Override it when the RCS message relies on its suggestions, since an SMS cannot carry them: `Your order has shipped. Reply Y to confirm.`
- **Media URLs** attaches media, which makes the fallback an MMS message

### Expire a time-sensitive message

**Expire At** under **Options** tells Voxtelesys to give up on a message that has not been sent by that time, rather than delivering it late. Useful for one-time passcodes and appointment reminders:

```
{{ $now.plus(5, 'minutes') }}
```

### Correlate delivery reports

Both resources share these options. **Tag** and **Bulk Tag** (under **Options**, max 256 characters each) are echoed back in callback events — use them to carry your own identifier for a message or a batch:

```
{{ $json.orderId }}
```

### Wait for a final delivery status

Set **Status Callback URL** under **Options** to `{{ $execution.resumeUrl }}` and follow the node with a **Wait** node set to resume on webhook call. Voxtelesys posts intermediate statuses (`queued`, `delivering`) as well as final ones (`delivered`, `failed`, `unknown`, `expired`), so branch on the status and loop back to the Wait node for any non-final value. To get Delivery Receipts, you need to set the Status Callback URL or add a messaging application with a callback set to your n8n workflow.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Voxtelesys Messaging API documentation](https://developer.voxtelesys.com/apis/message/)
- [Voxtelesys RCS API documentation](https://developer.voxtelesys.com/apis/rcs/)
- [Voxtelesys Portal](https://portal.voxtelesys.net)

## Version history

### 0.1.0 (Current)

- Send SMS/MMS messages