#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Tue Aug 28 18:55:39 2018

@author: yc
"""

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication

sender_dict = {
'host': 'smtp.exmail.qq.com',
'port': '465',
'user': 'mingzhen.zhou@asiainnovations.com',
'passwd': '17210MINGzhen'
}



class Mailer():

    def __init__(self, maillist, mailtitle, mailcontent, mailattachment, mailcontenttype):

        self.mail_list = maillist
        self.mail_title = mailtitle
        self.mail_content = mailcontent
        self.mail_attachment = mailattachment
        self.mail_content_type = mailcontenttype

        self.mail_host = sender_dict['host']
        self.mail_port = int(sender_dict['port'])
        self.mail_user = sender_dict['user']
        self.mail_pass = sender_dict['passwd']

    def send(self):

        me = self.mail_user + "<" + self.mail_user + ">"
        msg = MIMEMultipart()

        # 添加主题、发件人及收件人
        msg['Subject'] = self.mail_title
        msg['From'] = me
        if isinstance(self.mail_list, list):
            msg['To'] = ";".join(self.mail_list)
        else:
            raise TypeError('Not List')

        # 添加邮件正文
        text = MIMEText(self.mail_content, _subtype=self.mail_content_type, _charset='utf-8')
        msg.attach(text)

        # 添加附件
        if self.mail_attachment:

            if isinstance(self.mail_attachment, str):
                attach = self.mail_attachment
                part = MIMEApplication(open(attach, 'rb').read())
                part.add_header('Content-Disposition', 'attachment', filename=('gbk','',attach))
                msg.attach(part)

            if isinstance(self.mail_attachment, list):
                for a in self.mail_attachment:
                    part = MIMEApplication(open(a, 'rb').read())
                    if '/' in a:
                        a = a.split('/')[-1]
                    part.add_header('Content-Disposition', 'attachment', filename=('gbk','', a))
                    msg.attach(part)

        else:
            pass

        # 发送邮件

        try:
            with smtplib.SMTP_SSL() as s :
                s.connect(self.mail_host, port=self.mail_port)  # 连接到指定的smtp服务器。参数分别表示smpt主机和端口
                s.login(self.mail_user, self.mail_pass)  # 登录到你邮箱
                s.sendmail(me, self.mail_list, msg.as_string())  # 发送内容
        except Exception as e:
            print(e)


def send_mail(receivers, topic, content, attachment=None, content_type='plain'):
    """
    @receivers: 收件人列表,
    @topic:
    @content:
    @attachment: 附件路径，字符串或列表
    @content_type: 邮件正文类型，plain or html
    """
    Mail = Mailer(receivers, topic, content, attachment, content_type)
    Mail.send()


if __name__ == '__main__':
    mailto_list = ["mingzhen.zhou@asiainnovations.com"]
    mail_title = '社交媒体周汇总'
    mail_content = '<html><body><h1>Hello</h1><p>请查看附件中的数据</p></body></html>'
    send_mail(mailto_list, mail_title, mail_content, content_type='html')
