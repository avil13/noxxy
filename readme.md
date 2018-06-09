##Noxxy :
Fork [Noxy](https://www.npmjs.com/package/http-proxy) (**NO**de pro**XY** ) is a small proxy server allowing to use http-proxy with a JSON config file.

It allow for example to be used as a front proxy routing apps beetwen node.js, apache and nginx and support websockets.

NOXY: 80 > Apache:8080 | node:1337

installation : ``` npm install noxy -g ```

Usage :

``` noxy --help ```

``` noxy -c myrouting.conf.json ```


Example configuration :
```javascript
/**
* here is an example configuration for noxy (NOde proXY)
*/
{
	"server": {
		"hostname"	: "" // empty string to bind on everything
        "port": 5050
    },
    "default": { "target": "http://localhost:8080" },
    "domains": {
		// key is regular expression pattern
        ".*/dev/.*": { 
            "rm": "/dev", // remove str from url
            "target": "http://localhost:9090" 
        }
    }
}

```


###### generate PEM files for ssl
> openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365