/**
 * 模块导出
 * Email addon for ibird.
 * Author: yinfxs
 * Date: 2018-1-18 11:12:45
 */

const nodemailer = require('nodemailer');
const namespace = 'ibird-email';
const context = {
  api: {},
};

/**
 * 国际化配置
 */
const locales = {
  "zh_CN": {
    "locale": "简体中文",
    "email_config_success": "邮件配置成功",
    "email_send_failed": "邮件发送失败，请稍后重试",
    "email_send_success": "邮件发送成功：{{messageId}}",
  },
  "zh_TW": {
    "locale": "繁體中文",
    "email_config_success": "郵件配置成功",
    "email_send_failed": "郵件發送失敗，請稍後重試",
    "email_send_success": "郵件發送成功：{{messageId}}"
  },
  "en_US": {
    "locale": "English",
    "email_config_success": "Mail configuration is successful.",
    "email_send_failed": "Email failed, please try again later.",
    "email_send_success": "Message sent: {{messageId}}."
  }
}

/**
 * 加载回调
 * @param {Object} app - 应用实例
 * @param {Object} options - 引用选项
 */
function onload(app, options) {
  context.app = app;
  context.options = options;
  context.api.mailTransporter = nodemailer.createTransport(Object.assign({
    port: 587,
    secure: false
  }, options));
  app.info(app.getLocaleString('email_config_success'));
}

/**
 * 插件路由
 */
const routes = {
  'send_mail': {
    name: 'send_mail',
    method: 'POST',
    path: '/send_mail',
    middleware: async ctx => {
      try {
        const info = await (new Promise((resolve, reject) => {
          context.api.sendMail(ctx.request.body, (error, info) => {
            if (error) {
              return reject(error);
            }
            resolve(info);
          });
        }));
        ctx.body = { data: info };
      } catch (error) {
        ctx.body = {
          errcode: 500,
          errmsg: app.info(app.getLocaleString('email_send_failed')),
          errstack: error.message
        }
      }
    }
  }
};

/**
 * 插件API
 */
const api = {
  sendMail: (mailOptions, callback) => {
    const transporter = context.api.mailTransporter;
    mailOptions.from = mailOptions.from || context.options.from;
    callback = typeof callback === 'function' ? callback : (error, info) => {
      if (error) {
        return app.info(app.getLocaleString('email_send_failed') + ` ${error.message} `);
      }
      app.info(app.getLocaleString('email_send_success', { messageId: info.messageId }));
    };
    transporter.sendMail(mailOptions, callback);
  }
}

module.exports = {
  namespace,
  locales,
  onload,
  api: Object.assign(api, context.api)
}