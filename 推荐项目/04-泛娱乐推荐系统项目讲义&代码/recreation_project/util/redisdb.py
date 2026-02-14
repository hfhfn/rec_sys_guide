#!/usr/bin/python
# -*- coding: UTF-8 -*-


from rediscluster import StrictRedisCluster

import logging


class RedisClient:
    def __init__(self, startup_nodes):
        self.con = StrictRedisCluster(startup_nodes=startup_nodes, decode_responses=True)

    def bulkKV(self, data):
        con = self.con
        pp = con.pipeline()
        pp.command_stack = []
        for r in data:
            pp.pipeline_execute_command("SET", r[0], r[1])
        pp.execute()

    def bulkZSet(self, data):
        con = self.con
        pp = con.pipeline()
        pp.command_stack = []
        for r in data:
            pp.pipeline_execute_command("ZADD", r["key"], *r["value"])
        pp.execute()

    def execute(self, args):
        con = self.con
        return con.execute_command(*args)

    def bulk(self, data):
        con = self.con
        pp = con.pipeline()
        pp.command_stack = []
        for r in data:
            pp.pipeline_execute_command(*r)
        return pp.execute()

    def delKeys(self, keyPre):
        con = self.con
        keys = con.keys(keyPre)
        logging.info(" will delete keys count: %d" % (len(keys)))
        con.delete(*keys)

    def close(self):
        pass
