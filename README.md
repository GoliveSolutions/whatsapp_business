## Whatsapp Business

Whatsapp Business Solution Providers Integration


[https://docs.360dialog.com/whatsapp-api/whatsapp-api/messaging#check-contacts-and-send-messages](https://docs.360dialog.com/whatsapp-api/whatsapp-api/messaging#check-contacts-and-send-messages)

#### Check Contact Endpoints
- To check if number is a valid Whatsapp number and get wa_id
```
    POST https://waba.360dialog.io/v1/contacts
    {
    "blocking": "wait",
    "contacts": [
    "+55123456789"
    ],
    "force_check": true
    }

```
 #### Response
 ```
 {
    "contacts": [
        {
            "input": "+55123456789",
            "status": "valid",
            "wa_id": "55123456789"
        }
    ],
    "meta": {
        "api_status": "stable",
        "version": "2.35.4"
    }
}
 ```


#### Message format for text messages
```
{
    "recipient_type": "individual",
    "to": "wa_id",
    "type": "text",
    "text": {
        "body": "Hello, dear customer!"
    }
}
```

#### Message format for template messages
```
{
    "to": "wa_id",
    "type": "template",
    "template": {
        "namespace": "c8ae5f90_307a_ca4c_b8f6_d1e2a2573574",
        "language": {
            "policy": "deterministic",
            "code": "en"
        },
        "name": "template_name",
        "components": [{
                "type": "header",
                "parameters": [{
                        "type": "image",
                        "image": {
                            "link": "https://link-to-your-image.jpg"
                        }
                    }
                ]
            }, {
                "type": "body",
                "parameters": [{
                        "type": "text",
                        "text": "John"
                    }, {
                        "type": "text",
                        "text": "1234abcd"
                    }
                ]
            }
        ]
    }
}
```
#### License

MIT