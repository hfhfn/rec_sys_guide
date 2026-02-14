#!/usr/bin/python
# -*- coding: UTF-8 -*-

import pymysql
import logging


class Mysql:

    def __init__(self, host=None, port=None, user=None, password=None):
        self.con = pymysql.connect(host=host, port=port, user=user, password=password, charset="utf8")

    def select(self, sql, arg=None):
        con = self.con
        cur = con.cursor(pymysql.cursors.DictCursor)
        cur.execute(sql, arg)
        rows = cur.fetchall()
        return rows

    def bulk_insert(self, sqlstr, data):
        con = self.con
        cur = con.cursor()
        tmp = []
        total = 0
        for r in data:
            tmp.append(r)
            l = len(tmp)
            if l % 10000 == 0:
                total += l
                logging.info("insert total: %s" % (total))
                cur.executemany(sqlstr, tmp)
                con.commit()
                tmp = []
        if len(tmp) > 0:
            logging.info("insert total: %s" % (total + len(tmp)))
            cur.executemany(sqlstr, tmp)
            con.commit()

    def bulk_proc(self, proc, data):
        con = self.con
        cur = con.cursor()
        total = 0
        for r in data:
            total += 1
            cur.callproc(proc, r)
            if total % 10000 == 0:
                con.commit()
                logging.info("call %s : %s" % (proc, total))
        con.commit()
        logging.info("call %s : %s" % (proc, total))

    def close(self):
        if self.con is not None:
            self.con.close()
