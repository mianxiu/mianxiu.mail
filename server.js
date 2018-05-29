const express = require('express');
const AV = require('leanengine');
const sgMail = require('@sendgrid/mail');

// sendgrid API 推送邮件，免费版每日100条推送额度
function sendMail(subject) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    const msg = {
        to: 'mianxiu@mianxiu.me',
        from: 'mianxiu@mianxiu.me',
        subject: subject,
        text: 'and easy to do anywhere, even with Node.js',
        html: '<strong>and easy to do anywhere, even with Node.js</strong>',
    };
    sgMail.send(msg);
}

AV.init({
    appId: process.env.LEANCLOUD_APP_ID,
    appKey: process.env.LEANCLOUD_APP_KEY,
    masterKey: process.env.LEANCLOUD_APP_MASTER_KEY 
  });

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
               // writeLastPost('5b0b99ae2f301e00381813c5', e.createdAt)
                console.log()
                let a = '有' + (r.length) + '条新留言'
                //
                sendMail(a)
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
PushMailTips('mianxiu@mianxiu.me')



