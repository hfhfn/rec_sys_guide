# 1.3 开发环境介绍

## 学习目标

- 目标
  - 了解黑马头条推荐系统基本环境
- 应用
  - 无

相关单机版本和分布式版本开发大数据环境以及Python环境参考PDF文件：

* 黑马头条推荐分布式&单机版大数据环境使用教程.pdf


### 1.3.3 python开发对应

装有anaconda系列虚拟环境即可，在这里先创建一个用于后面项目使用的虚拟环境，centos已提供miniconda2环境(单机版&分布式版本都已经安装了所有Python环境)

```
conda create -n reco_sys python=3.6.7

pip install -r requirements.txt --ignore-installed
```

### 开发配置 

pycharm关联连接本地项目与centos项目目录开发，配置如下，添加远程机器的IP和用户名，往后密码以及python环境位置，本地关联远程工程目录

![](../images/添加步骤.png)

本地项目选定远程环境开发：

![](../images/pycharm远程连接.png)

