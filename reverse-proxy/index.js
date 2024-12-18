const express = require('express')
const httpProxy = require('http-proxy')

const app = express()
const PORT = 8000

const BASE_PATH = 'https://tb-one-space.s3.amazonaws.com/__outputs/'

const proxy = httpProxy.createProxy({
    changeOrigin: true
});

app.get('/health', (req, res) => {
  return res.json(
    {
      msg: "Hi from TB!"
    });
})

app.use((req, res) => {
    const hostname = req.hostname;
    const subdomain = hostname.split('.')[0];
    
    const resolvesTo = `${BASE_PATH}${subdomain}`
    
    console.log(resolvesTo+"/index.html")

    return proxy.web(req, res, { target: resolvesTo })
})

proxy.on('proxyReq', (proxyReq, req, res) => {
    const url = req.url;
    if (url === '/')
        proxyReq.path += 'index.html'
})

app.listen(PORT, () => console.log(`Reverse Proxy Running - ${PORT}`))