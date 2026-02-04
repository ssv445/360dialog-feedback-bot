# Sandbox

We provide a developer-friendly test environment for anyone who wants to explore the usage of our WhatsApp API. You can test sending messages and templates in the test environment.&#x20;

Sandbox Base Path: `https://waba-sandbox.360dialog.io/`

Each phone number has its own API key, and you are able to test sending messages/templates only to your phone number.

## Limitations

### **What you can do with the sandbox**&#x20;

* You can use the sandbox API key to send freeform messages and templates to your own phone number.
* A maximum of 200 messages can be sent with the sandbox.
* Your phone number acts like a user and can send and receive messages.&#x20;
* The number can be a landline number, as long it is able to use WhatsApp.
* You can change your webhook URL at any time.
* Each Sandbox API key is linked to one phone number and you can only send test messages to that phone number. If you wish to send messages to more than just your phone number, then we recommend setting up a WhatsApp Business Account to use instead of the sandbox.

### **What you can't do with the sandbox**

* The Sandbox is a test environment only. Messages and Templates can be sent only to your own phone number.
* You can send only two types of templates: Marketing and interactive.
* We do not yet provide response information when you use the WhatsApp API.
* Uploading and retrieving media files using the media ID.

## How to get started with sandbox

{% stepper %}
{% step %}

### **Get an API Key**

You can get an API key by sending a message on WhatsApp to phone number `+551146733492` with the content **`START`** (**`START`** must be in all UPPERCASE). You can quickly send the message by:

* Clicking this link: <https://wa.me/551146733492?text=START>
* Or scanning this QR code on your phone:

<figure><img src="https://3527970750-files.gitbook.io/~/files/v0/b/gitbook-x-prod.appspot.com/o/spaces%2F-M4sMxKjL6eJRvZn6jeG-887967055%2Fuploads%2Fd0O76h54j7uPnvGAtfol%2Fimage.png?alt=media&#x26;token=3fe7d501-8e88-47f6-8202-d1e23ba0036b" alt="" width="303"><figcaption></figcaption></figure>

You will later receive a response containing your API key. This API key needs to be used when making API requests.
{% endstep %}

{% step %}

### **Set the Sandbox Webhook URL**

<mark style="color:green;">`POST`</mark> `https://waba-sandbox.360dialog.io/v1/configs/webhook`

Setting a webhook URL is necessary for receiving messages (and message status updates). Any message you send to `+551146733492` will be forwarded to the webhook URL you set.

You can use an external service (such as [requestbin.com](https://pipedream.com/requestbin) or [webhook.site](https://webhook.site/)) to create a temporary webhook URL. You can also use an external service such as ngrok to tunnel a port from localhost to a temporary public URL.

The API key you received in the previous step needs to be passed in the **D360-API-KEY** header.

**Request Example**

```shellscript
curl --request POST \
  --url https://waba-sandbox.360dialog.io/v1/configs/webhook \
  --header 'Content-Type: application/json' \
  --header 'D360-API-KEY: YOUR_API_KEY' \
  --data '{"url": "https://your-webhook-adress"}'
```

**Headers**

| Name           | Value              |
| -------------- | ------------------ |
| `Content-Type` | `application/json` |
| `D360-API-KEY` | Your API key       |

**Request Body**

| Name  | Type   | Value            |
| ----- | ------ | ---------------- |
| `url` | string | Your webhook URL |

{% tabs %}
{% tab title="200 Webhook URL Set" %}

```json
{
    "url": "https://example-webhook-url"
}
```

{% endtab %}
{% endtabs %}
{% endstep %}

{% step %}

### **Send a Message to the Sandbox**

Send a message to the number `+551146733492` again. You will receive an Inbound Message event on your webhook. This webhook event contains the phone number that sent the message, along with the message's contents. An example of it can be seen below.

The webhook is not just used for receiving messages; it is also used for receiving status updates on your outbound messages. After you send a message via the API, you will receive a webhook event when the message is sent/delivered to your recipient, and when your recipient has read the message.

{% tabs %}
{% tab title="Inbound Message event" %}

```json
{
    "contacts": [
        {
            "profile": {
                "name": USER_NAME
            },
            "wa_id": PHONE_NUMBER
        }
    ],
    "messages": [
        {
            "from": PHONE_NUMBER,
            "id": "wamid.ID",
            "text": {
                "body": "MESSAGE_BODY"
            },
            "timestamp": "1591955533",
            "type": "text"
        }
    ]
```

{% endtab %}

{% tab title="Message Status event" %}

```json
{
    "statuses": [
        {
            "id": "gBGGSHggVwIvAgk4hwKJv9PdlG4",
            "recipient_id": "55YOURNUMBER",
            "status": "read",
            "timestamp": "1591955668"
        }
    ]
}
```

{% endtab %}
{% endtabs %}
{% endstep %}

{% step %}

### **Respond using the Sandbox API**

**Send response message**

<mark style="color:green;">`POST`</mark> `https://waba-sandbox.360dialog.io/v1/messages`

You can send a response message (or a message template) to the phone WhatsApp number with the above request URL and the body parameters as described below.

**Request Example**

```shellscript
curl --request POST \
  --url https://waba-sandbox.360dialog.io/v1/messages \
  --header 'Content-Type: application/json' \
  --header 'D360-API-KEY: YOUR_API_KEY' \
  --data '{"to":"YOUR_PHONE_NUMBER","type":"text","text":{"body":"Hello world"}}'
```

**Headers**

| Name           | Value              |
| -------------- | ------------------ |
| `Content-Type` | `application/json` |
| `D360-API-KEY` | Your API key       |

**Request Body**

<table><thead><tr><th width="185">Name</th><th width="199.800048828125">Description</th><th>Key</th></tr></thead><tbody><tr><td><code>recipient_type</code></td><td>string</td><td>Set to <code>individual</code></td></tr><tr><td><code>to</code></td><td>number</td><td>Set to your phone number</td></tr><tr><td><code>type</code></td><td>string</td><td>Set to <code>text</code></td></tr><tr><td><code>text</code></td><td>object</td><td>Contains a <code>body</code> string field, which is where your message should go (e.g. <code>"body": "Hello world"</code>)</td></tr></tbody></table>

{% tabs %}
{% tab title="Example Request Payload  " %}

```json
{
    "messaging_product": "whatsapp",
    "recipient_type": "individual",
    "to": "<YOUR_PHONE_NUMBER>",
    "type": "text",
    "text": {
        "body": "Hello world"
    }
}
```

{% endtab %}

{% tab title="201 Message Created Successfully" %}

```json
{
    "messages": [
        {
            "id": "message_id"
        }
    ],
    "meta": {
        "api_status": "stable",
        "version": "2.31.5"
    }
}
```

{% endtab %}
{% endtabs %}
{% endstep %}

{% step %}

### **Send a Template Message (optional)**

<mark style="color:green;">`POST`</mark> `https://waba-sandbox.360dialog.io/v1/messages`

There are 3 templates available to test in the sandbox. There is no possibility to add or edit templates; you must use one of the predefined templates listed below.\
\
**Available templates are:**

* `disclaimer`\
  Using this template will just send a regular text message, which can’t be edited.
* `first_welcome_messsage`\
  This is an example of a template with a personalization possibility (you can personalize the receiver's name).
* `interactive_template_sandbox`\
  This template contains 2 buttons for which you can pass customer URLs.

**Request Example**

```bash
curl --request POST \
  --url https://waba-sandbox.360dialog.io/v1/messages \
  --header 'Content-Type: application/json' \
  --header 'D360-API-KEY: YOUR_API_KEY' \
  --data '{"to": "YOUR_PHONE_NUMBER", "messaging_product": "whatsapp", "type": "template", "template": { "name": "first_welcome_messsage", "language": { "code": "en" }, "components": [ { "type": "body", "parameters": [ { "type": "text", "text": "Placeholder 1"}'
```

**Headers**

| Name           | Value              |
| -------------- | ------------------ |
| `Content-Type` | `application/json` |
| `D360-API-KEY` | Your API key       |

**Request Body**

If the request is valid, you will receive an HTTP 201 success response.

{% tabs %}
{% tab title="201: Created " %}

```json
{
    "messages": [
        {
            "id": "message_id"
        }
    ],
    "meta": {
        "api_status": "stable",
        "version": "2.35.4"
    }
}
```

{% endtab %}
{% endtabs %}

**Example Request Payload**

**`first_welcome_messsage`**

```json
{
  "to": "<YOUR_PHONE_NUMBER>",
  "messaging_product": "whatsapp",
  "type": "template",
  "template": {
    "name": "first_welcome_messsage",
    "language": {
      "code": "en"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          {
            "type": "text",
            "text": "Placeholder 1"
          }
        ]
      }
    ]
  }
}
```

Note that this example covers `first_welcome_messsage` with personalization. In the case of the `disclaimer` template, the payload is similar but with an empty `components` array (it holds personalization parameters which are not used in `disclaimer`).

If you would like to quickly give the other two templates a try, you can use the JSON body snippets below:

{% tabs %}
{% tab title="'disclaimer' template JSON body" %}

```json
{
  "to": "<YOUR_PHONE_NUMBER>",
  "messaging_product": "whatsapp",
  "type": "template",
  "template": {
    "name": "disclaimer",
    "language": {
      "code": "en"
    },
    "components": []
  }
}
```

{% endtab %}

{% tab title="'interactive\_template\_sandbox' template JSON body" %}

```json
{
  "to": "<YOUR_PHONE_NUMBER>",
  "messaging_product": "whatsapp",
  "type": "template",
  "template": {
    "name": "interactive_template_sandbox",
    "language": {
      "code": "en"
    },
    "components": [
      {
        "type": "button",
        "sub_type": "quick_reply",
        "index": 0,
        "parameters": [
          {
            "type": "payload",
            "payload": "aGlzIHRoaXMgaXMgY29vZHNhc2phZHdpcXdlMGZoIGFTIEZISUQgV1FEV0RT"
          }
        ]
      },
      {
        "type": "button",
        "sub_type": "quick_reply",
        "index": 1,
        "parameters": [
          {
            "type": "payload",
            "payload": "aGlzIHRoaXMgaXMgY29vZHNhc2phZHdpcXdlMGZoIGFTIEZISUQgV1FEV0RT"
          }
        ]
      }
    ]
  }
}
```

{% endtab %}
{% endtabs %}
{% endstep %}
{% endstepper %}
