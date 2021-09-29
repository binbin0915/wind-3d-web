const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Clean = require('clean-webpack-plugin');

const SOURCE_PATH = path.resolve('./src/');

let PUBLIC_PATH = '/eoswind3dweb/';

const port = 9200;
const debug = !!(require('process').argv.indexOf('-d') >= 0);

module.exports = env => {

    var config = {
        context: SOURCE_PATH,
        entry: {
            index: ['babel-polyfill', './index']
        },
        output: {
            publicPath: './',
            path: path.join(__dirname, PUBLIC_PATH),
            filename: 'res/[name]/index.[chunkhash:8].bundle.js',
            libraryTarget: 'umd'
        },
        resolve: {
            extensions: ['.js', '.jsx']
        },
        module: {
            loaders: [{
                test: /\.(js|jsx)$/,
                loader: 'babel-loader?cacheDirectory',
                include: [path.join(__dirname, 'src')]
            }, {
                test: /\.css$/,
                loader: 'style-loader!css-loader?-autoprefixer!postcss-loader'
            }, {
                test: /\.(less)$/,
                loader: 'style-loader!css-loader?-autoprefixer!postcss-loader!less-loader'
            }, {
                test: /\.(png|jpg|gif|glb)$/,
                loader: 'url-loader'
            }, {
                test: /\.(eot|woff|woff2|otf|ttf|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: 'file-loader'
            }, {
                test: /\.json$/,
                loader: 'json-loader',
                exclude: /node_modules/
            }]
        },
        devtool: debug ? 'source-map' : undefined,
        plugins: [
            new webpack.optimize.CommonsChunkPlugin({
                name: "common",
                filename: "commons.bundle.[hash].js"
            }),
            new HtmlWebpackPlugin({
                filename: 'index.html',
                template: './index.html',
                chunks: ['common', 'index'],
                inject: true
            }),
            new webpack.ProvidePlugin({
                React: "react"
            }),
            // new webpack.DefinePlugin({
            //     DATASERV_PATH: JSON.stringify(DATASERV_PATH)
            // })
        ],
        devServer: {
            publicPath: `${PUBLIC_PATH}`,
            disableHostCheck: true,
            hot: true,
            inline: false,
            port: port,
            host: '0.0.0.0',
            proxy: [{
                context: ['/wenlportfolioservice/**'],
                changeOrigin: true,
                target: 'https://app-portal-ppe1.envisioniot.com', // ppe 2.0 环境
                // target: 'https://app-portal-xhpd1.eniot.io', // xhsd
                // target: 'https://app-portal-cn5.envisioniot.com', // cn5 环境
                // target: 'https://app-portal-eu2.envisioniot.com', // eu2 环境
                secure: false,
                bypass: function (req, res, proxyOptions) {
                    console.log('/wenlportfolioservice/**', req.url);
                    if (req.path.indexOf("guide") !== -1 || req.path.indexOf("mockdata") !== -1) {
                        console.log("Skipping proxy for browser request.");
                        return req.path;
                    }
                }
            }, {
                context: ['/**', '/login/**', '/portal/**'],
                changeOrigin: true,
                target: 'https://app-portal-ppe1.envisioniot.com', // ppe 地址
                // target: 'https://app-portal-xhpd1.eniot.io', // xhsd
                // target: 'https://app-portal-cn5.envisioniot.com', // cn5 环境
                // target: 'https://app-portal-eu2.envisioniot.com', // eu2 环境
                secure: true,
                bypass: function (req, res, proxyOptions) {
                    console.log('/staitc/**', '/portal/**', '/login/**', req.url);
                    if (req.path.indexOf("guide") !== -1 || req.path.indexOf("mockdata") !== -1) {
                        console.log("Skipping proxy for browser request.");
                        return req.path;
                    }
                }

            }]
        }
    }

    if (debug) {
        console.info("debug mode: " + debug);
        config.plugins.push(new webpack.NoErrorsPlugin());
        config.plugins.push(new webpack.HotModuleReplacementPlugin());
        //打开浏览器
        var http = 'http';
        if (require('process').argv.indexOf('--https') >= 0) {
            http = 'https';
        }

        require('child_process').exec("start " + http + "://" + getLocalIP() + ":" + port + PUBLIC_PATH + "index.html");
        require('child_process').exec("open " + http + "://" + getLocalIP() + ":" + port + PUBLIC_PATH + "index.html");
    } else {
        config.plugins.push(new Clean([path.join(__dirname, PUBLIC_PATH)]));
        config.plugins.push(new webpack.DefinePlugin({
            "process.env": {
                NODE_ENV: '"production"'
            }
        }));
        // config.plugins.push(new webpack.optimize.UglifyJsPlugin({
        //     sourceMap: true,
        //     compress: {
        //         warnings: false
        //     }
        // }));
    }

    return config;
}

function getLocalIP() {
    // var nets = require('os').networkInterfaces();
    // for (var devname in nets) {
    //     if (devname.indexOf('Pseudo') >= 0) continue;

    //     var device = nets[devname];
    //     for (var i in device) {
    //         var network = device[i];
    //         var head = network.address.split(".")[0];

    //         if (network.family == 'IPv4' && (head == "192" || head == "10" || head == "172")) {
    //             return network.address;
    //         }
    //     }
    // }
    return "localhost";
}