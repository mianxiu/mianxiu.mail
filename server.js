const express = require('express');
const AV = require('leanengine');
const sgMail = require('@sendgrid/mail');

const domin = "//mianxiu.me"

// 监听端口
var app = express();
app.use(AV.express());
app.listen(process.env.LEANCLOUD_APP_PORT);

// 初始化
AV.init({
    appId: process.env.LEANCLOUD_APP_ID,
    appKey: process.env.LEANCLOUD_APP_KEY,
    masterKey: process.env.LEANCLOUD_APP_MASTER_KEY 
  });


// sendgrid API 推送邮件，免费版每日100条推送额度
function sendMail(subject,html) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
        to: 'mianxiu@mianxiu.me',
        from: 'notification@mianxiu.me',
        subject: subject,
        text: 'and easy to do anywhere, even with Node.js',
        html: html,
    };
    sgMail.send(msg);
}

// 部署在leancloud 云引擎
function PushMailTips(pushMail) {
    let CountCommentId

    // 转换时间格式 YYYY-MM-DD HH:MM:SS
    function parseDate(ms) {
        let f = new Date(ms)
        let y = f.getFullYear()
        let m = (f.getMonth() + 1) < 10 ? '0' + (f.getMonth() + 1) : (f.getMonth() + 1)
        let d = f.getDate() < 10 ? '0' + f.getDate() : f.getDate()
        let h = f.getHours() < 10 ? '0' + f.getHours() : f.getHours()
        let min = f.getMinutes() < 10 ? '0' + f.getMinutes() : f.getMinutes()
        let sec = f.getSeconds() < 10 ? '0' + f.getSeconds() : f.getSeconds()

        return y + '-' + m + '-' + d + ' ' + h + ':' + min + ':' + sec
    }

    // 推送后更新留言日期
    function writeLastPost(objId, lastPost) {
        let up = AV.Object.createWithoutData('CountComment', objId);
        up.set('lastPost', lastPost);
        up.save().then(r => { })
    }

    // 查询之前最后一条留言到现在之间的留言数
    function GetTodoCount(startDate) {
        // 
        let startDateQuery = new AV.Query('Todo');
        startDateQuery.greaterThanOrEqualTo('createdAt', startDate);
        let endDateQuery = new AV.Query('Todo');
        endDateQuery.lessThan('createdAt', new Date(parseDate(Date.now())));

        let query = AV.Query.and(startDateQuery, endDateQuery);
        query.find().then(r => {
            if (r.length > 0) {
                let e = r[r.length - 1]             
                let a = '你的BLOG有' + (r.length) + '条新留言'
                let html = ''
                for(i of r){
                    let attr = i.attributes
                    let d = i.createdAt
                    let u = domin + attr.url
                    let c = attr.comments
                    let n = attr.usernick

                    let li = `<div style="marign:10px 0;background-color:#f8f8f8;border:1px solid #ececec;border-radius:4px;padding:10px;">
                        <a style="border-radius: 4px;display: inline-block; color: #ffffff;text-decoration: none;padding: 10px;background-color: #2a96d8;
                        margin: 5px;" href="${u}">${decodeURI(attr.url.split('/')[5])}</a>
                        <span>${n}</span>："${c}"
                        <span style="margin:0 10px;" >${d}</span>
                        </div>`

                        html += li
                }

                 sendMail(a,html)
                // writeLastPost('5b0b99ae2f301e00381813c5', e.createdAt)
            }

        }, function (error) {
        });
    }

    // 查询countComment类，获取上次推送的留言的createdAt
    function GetCount() {
        var queryCount = new AV.Query('CountComment');
        queryCount.find().then(r => {
            let i = r[0].attributes
            GetTodoCount(i.lastPost)
            CountCommentId = r[0].id
        }, function (error) { })
    }
    GetCount()
}

// 定时拉取
setInterval(()=>{
    PushMailTips('mianxiu@mianxiu.me')
},300000)




