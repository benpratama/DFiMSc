"$schema": "http://json-schema.org/draft-07/schema#",
"type": "object",
"patternProperties": {
  "^.*$": {
    "type": "object",
    "properties": {
      "ip_code": {
        "type": "integer",
        "minimum": 0,
        "maximum": 255
      },
      "os": {
        "type": "string",
        "enum": ["ubuntu", "windows"]
      },
      "role": {
        "type": "string",
        "enum": ["ControlPlane", "WorkerNode"]
      },
      "name": {
        "type": "string",
        "minLength": 1
      },
      "host_name": {
        "type": "string",
        "minLength": 1
      },
      "domain": {
        "type": "string",
        "minLength": 1
      },
      "ipv4_address": {
        "type": "string",
        "format": "ipv4"
      },
      "ipv4_netmask": {
        "type": "integer",
        "minimum": 0,
        "maximum": 32
      },
      "ipv4_gateway": {
        "type": "string",
        "format": "ipv4"
      },
      "dns_server_list": {
        "type": "array",
        "items": {
          "type": "string",
          "format": "ipv4"
        },
        "minItems": 1
      },
      "computer_name": {
        "type": "string",
        "minLength": 1
      },
      "admin_password": {
        "type": "string",
        "minLength": 1
      }
    },
    "required": ["ip_code", "os", "role", "name", "ipv4_address", "ipv4_netmask", "ipv4_gateway", "dns_server_list"],
    "if": {
      "properties": { "os": { "const": "windows" } }
    },
    "then": {
      "required": ["computer_name", "admin_password"]
    },
    "else": {
      "required": ["host_name", "domain"]
    }
  }
},
"additionalProperties": false