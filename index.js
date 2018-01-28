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
    "email_config_success": "邮件服务“{{name}}”配置成功",
    "email_send_failed": "邮件发送失败，请稍后重试",
    "email_send_success": "邮件发送成功：{{{messageId}}}",
  },
  "zh_TW": {
    "locale": "繁體中文",
    "email_config_success": "郵件配置成功",
    "email_config_success": "郵件服務“{{name}}”配置成功",
    "email_send_failed": "郵件發送失敗，請稍後重試",
    "email_send_success": "郵件發送成功：{{{messageId}}}"
  },
  "en_US": {
    "locale": "English",
    "email_config_success": "Transporter '{{name}}' configured successfully.",
    "email_send_failed": "Email failed, please try again later.",
    "email_send_success": "Message sent: {{{messageId}}}."
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
  if (Array.isArray(options) && options.length > 0) {
    for (const item of options) {
      createTransport(app, item);
    }
  } else {
    options.name = 'default';
    createTransport(app, options);
  }
}

/**
 * 创建邮件transporter
 * @param {*} options 
 */
function createTransport(app, options) {
  if (!options || !options.name) return;

  const trs = context.api.mailTransporters || {};
  try {
    const tr = nodemailer.createTransport(Object.assign({
      port: 587,
      secure: false
    }, options));
    trs[options.name] = tr;
  } catch (error) { }

  context.api.mailTransporters = trs;
  app.info(app.getLocaleString('email_config_success', { name: options.name }));
  return trs[options.name];
}

/**
 * 发送邮件路由
 */
async function sendMailRoute(ctx) {
  try {
    const info = await sendMail(ctx.request.body);
    ctx.body = { data: info };
  } catch (error) {
    ctx.body = {
      errcode: 500,
      errmsg: app.info(app.getLocaleString('email_send_failed')),
      errstack: error.message
    }
  }
}

/**
 * 发件API
 * @param {} mailOptions 
 */
async function sendMail(mailOptions) {
  const app = context.app;
  mailOptions.from = mailOptions.from || context.options.from;
  const name = mailOptions.name || 'default';
  const transporter = context.api.mailTransporters[name];
  if (!transporter) throw new Error(`Transporter '${name}' is not configured.`);

  try {
    const info = await (new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          return reject(error);
        }
        return resolve(info);
      });
    }));
    app.info(app.getLocaleString('email_send_success', { messageId: info.messageId }));
    return info;
  } catch (error) {
    app.info(app.getLocaleString('email_send_failed') + ` ${error.message} `);
  }
}

/**
 * 插件路由
 */
const routes = {
  'send_mail': {
    name: 'send_mail',
    method: 'POST',
    path: '/send_mail',
    middleware: sendMailRoute
  }
};

/**
 * 插件API
 */
const api = {
  sendMail
}

module.exports = {
  namespace,
  locales,
  onload,
  api: Object.assign(api, context.api)
}