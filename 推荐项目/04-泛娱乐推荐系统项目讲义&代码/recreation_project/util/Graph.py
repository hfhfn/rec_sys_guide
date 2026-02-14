#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Created on Thu Aug  9 11:05:28 2018

@author: zmz
"""
from neo4j.v1 import GraphDatabase

class Neo4j(object):

    def __init__(self, neo4j_config):
        self._driver = GraphDatabase.driver(**neo4j_config)

    def close(self):
        self._driver.close()

    def write(self, cypher):
        with self._driver.session() as session:
            session.run(cypher)

    def transa_write(self, cypher):
        with self._driver.session() as session:
            with session.begin_transaction() as tx:
                tx.run(cypher)

    def read(self, cypher):
        with self._driver.session() as session:
            record = session.run(cypher)
            result = list(map(lambda x: x[0], record))
        return result

