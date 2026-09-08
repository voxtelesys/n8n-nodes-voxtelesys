# @voxtelesys/n8n-nodes-voxtelesys

This is an n8n community node. It lets you send SMS and MMS messages with Voxtelesys in your n8n workflows.


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

### Messaging

- **Send SMS/MMS**: Sends a SMS/MMS message

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

### Correlate delivery reports

**Tag** and **Bulk Tag** (under **Options**, max 256 characters each) are echoed back in callback events — use them to carry your own identifier for a message or a batch:

```
{{ $json.orderId }}
```

### Wait for a final delivery status

Set **Status Callback URL** under **Options** to `{{ $execution.resumeUrl }}` and follow the node with a **Wait** node set to resume on webhook call. Voxtelesys posts intermediate statuses (`queued`, `delivering`) as well as final ones (`delivered`, `failed`, `unknown`, `expired`), so branch on the status and loop back to the Wait node for any non-final value.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [Voxtelesys Messaging API documentation](https://developer.voxtelesys.com/apis/message/)
- [Voxtelesys Portal](https://portal.voxtelesys.net)

## Version history

### 0.1.0 (Current)

- Send SMS/MMS messages