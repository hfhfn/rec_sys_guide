# 8.1 TFRecords与黑马训练数据存储

## 学习目标

- 目标
  - 说明深度学习样本流程实践
  - 说明Example的结构
- 应用
  - 应用TF保存Spark构建的样本到TFRecords文件

## 8.1.1 深度学习训练样本流程实践

Spark原始数据整合 -> Spark/TF生成TFRecord -> TF数据并行训练 -> TensorFlow Serving线下评估 -> CPU线上预测。TFRecords是TensorFlow官方推荐使用的数据格式化存储工具，它不仅规范了数据的读写方式，还大大地提高了IO效率。

![](../images/实时排序逻辑.png)

#### 8.1.1.1 剥离预处理流程

在模型的试验阶段，为了快速试验，数据预处理逻辑与模型训练部分都耦合在一起，而数据预处理包含大量IO类型操作，所以很适合用HadoopMR或者Spark处理。具体流程如下：

1、在预处理阶段将查表、join字典等操作都做完，并且将查询结果与原始数据merge在一起。

2、将libfm格式的数据转为易于TensorFlow操作的SparseTensor方式：

3、将原始数据转换为TensorFlow Record。

#### 8.1.1.2 选择正确的IO训练方式

TensorFlow读取数据的方式主要有2种，一般选择错误会造成性能问题，两种方式为：

* Feed_dict：通过feed_dict将数据喂给session.run函数，这种方式的好处是思路很清晰，易于理解。缺点是性能差，性能差的原因是feed给session的数据需要在session.run之前准备好，如果之前这个数据没有进入内存，那么就需要等待数据进入内存，而在**实际场景中，这不仅仅是等待数据从磁盘或者网络进入内存的事情，还可能包括很多前期预处理的工作也在这里做，所以相当于一个串行过程。此时，GPU显存处于等待状态，同时，由于tf的Graph中的input为空，所以CPU也处于等待状态，无法运算。**

* RecordReader：
  * 在tf中还有batch与threads的概念，可以异步的读取数据，保证在GPU或者CPU进行计算的时候，读取数据这个操作也可以多线程异步执行。

#### 优化过程

* 将整体程序中的预处理部分从代码中去除，直接用Map-Reduce批处理去做。
* MR输出为TensorFlow Record格式，避免使用Feed_dict。

## 8.1.2 什么是TFRecords文件

TFRecords其实是一种二进制文件，虽然它不如其他格式好理解，但是它能更好的利用内存，更方便复制和移动，**并且不需要单独的标签文件**。TFRecords内部使用了“Protocol Buffer”二进制数据编码方案，只要生成一次TFRecords，之后的数据读取和加工处理的效率都会得到提高。

- 文件格式 *.tfrecords 

优势以及特点：

* 使用TFRecords和直接从硬盘读取原生数据相比到底有什么优势呢？
  * Tensorflow有和TFRecords配套的一些函数，可以加快数据的处理。实际读取TFRecords数据时，先以相应的TFRecords文件为参数，创建一个输入队列，这个队列有一定的容量（视具体硬件限制，用户可以设置不同的值），在一部分数据出队列时，TFRecords中的其他数据就可以通过预取进入队列，并且这个过程和网络的计算是独立进行的。
  * 网络每一个iteration的训练不必等待数据队列准备好再开始，队列中的数据始终是充足的，而往队列中填充数据时，也可以使用多线程加速。

![](../images/内存队列.png)

**读取线程源源不断地将文件系统中的图片读入到一个内存的队列中，而负责计算的是另一个线程，计算需要数据时，直接从内存队列中取就可以了。这样就可以解决GPU因为IO而空闲的问题！**

## 8.1.3 Example结构解析

TFRecords文件包含了`tf.train.Example` 协议内存块(protocol buffer)(协议内存块包含了字段 `Features`)。可以获取你的数据， 将数据填入到`Example`协议内存块(protocol buffer)，将协议内存块序列化为一个字符串， 并且通过`tf.python_io.TFRecordWriter` 写入到TFRecords文件。

* exampel:`tf.train.Example` 协议内存块(protocol buffer)(协议内存块包含了字段 `Features`)，`Features`包含了一个`Feature`字段，`Features`中包含要写入的数据、并指明数据类型。这是一个样本的结构，批数据需要循环存入这样的结构

```python
 example = tf.train.Example(features=tf.train.Features(feature={
                "features": tf.train.Feature(bytes_list=tf.train.BytesList(value=[features])),
                "label": tf.train.Feature(int64_list=tf.train.Int64List(value=[label])),
            }))
```

- tf.train.Example(**features**=None)
  - 写入tfrecords文件
  - features:tf.train.Features类型的特征实例
  - return：example格式协议块
- tf.train.**Features**(**feature**=None)
  - 构建每个样本的信息键值对
  - feature:字典数据,key为要保存的名字
  - value为tf.train.Feature实例
  - return:Features类型
- tf.train.**Feature**(options)
  - options：例如
    - bytes_list=tf.train. BytesList(value=[Bytes])
    - int64_list=tf.train. Int64List(value=[Value])
  - 支持存入的类型如下
  - tf.train.Int64List(value=[Value])
  - tf.train.BytesList(value=[Bytes]) 
  - tf.train.FloatList(value=[value]) 

> 这种结构是不是很好的解决了**数据和标签(训练的类别标签)或者其他属性数据存储在同一个文件中** 

使用步骤：

**在将其他数据存储为TFRecords文件的时候，需要经过两个步骤：**
**（1）建立TFRecord存储器**
**（2）构造每个样本的Example模块**
**构造每个样本的Example步骤**
**（1）读取待存文件内容，转化为bytes或者其他类型形式**
**（2）数据合并成tf.train.Features(类似dict形式）**
**（3）把features存入一个tf.train.Example**
**（4）把example序列化，并写入文件**

**第一步，生成TFRecord Writer**

```python3
writer = tf.python_io.TFRecordWriter(path, options=None)
```

**path：**TFRecord文件的存放路径；

**option：**TFRecordOptions对象，定义TFRecord文件保存的压缩格式；

**第二步 1、指定tf.train.Feature类型，合并成tf.train.Features**

一个协议信息特征（这里翻译可能不准确）是将原始数据编码成特定的格式，内层feature是一个字典值，它是将某个类型列表编码成特定的feature格式，而该字典键用于读取TFRecords文件时索引得到不同的数据，某个类型列表可能包含零个或多个值，**列表类型一般有BytesList, FloatList, Int64List**

```python3
tf.train.BytesList(value=[value]) # value转化为字符串（二进制）列表
tf.train.FloatList(value=[value]) # value转化为浮点型列表
tf.train.Int64List(value=[value]) # value转化为整型列表
```

其中，value是你要保存的数据。内层feature编码方式：

```python3
feature_internal = {
"width":tf.train.Feature(int64_list=tf.train.Int64List(value=[width])),
"weights":tf.train.Feature(float_list=tf.train.FloatList(value=[weights])),
"image_raw":tf.train.Feature(bytes_list=tf.train.BytesList(value=[image_raw]))
}
```

外层features再将内层字典编码：

```text
features_extern = tf.train.Features(feature_internal)
```

* tf.train.Feature这个接口可以编码封装列表类型和字典类型，内层用的是tf.train.Feature
* 外层使用tf.train.Features

**使用tf.train.Example将features编码数据封装成特定的PB协议格式**

```text
example = tf.train.Example(features_extern)
```

**3、将example数据系列化为字符串**

```text
example_str = example.SerializeToString()
```

**4、将系列化为字符串的example数据写入协议缓冲区**

```text
writer.write(example_str)
```

## 8.1.4 案例：CIFAR10数据存入TFRecords文件

### 8.1.4.1 分析

![](../images/离线样本构造.png)

- 构造存储实例，tf.python_io.TFRecordWriter(path)
  - 写入tfrecords文件
  - path: TFRecords文件的路径
  - return：写文件
  - method
  - write(record):向文件中写入一个example
  - close():关闭文件写入器
- 循环将数据填入到`Example`协议内存块(protocol buffer)

### 8.1.4.2 代码

对于每一个点击事件样本数据，都需要写入到example当中，所以这里需要取出每一样本进行构造存入

```python
# 保存到TFRecords文件中
df = train_res.select(['user_id', 'article_id', 'clicked', 'features'])
df_array = df.collect()
import pandas as pd
df = pd.DataFrame(df_array)
```

存储

```python
import tensorflow as tf

def write_to_tfrecords(click_batch, feature_batch):
    """将用户与文章的点击日志构造的样本写入TFRecords文件
    """
    
    # 1、构造tfrecords的存储实例
    writer = tf.python_io.TFRecordWriter("./train_ctr_20190605.tfrecords")
    
    # 2、循环将所有样本一个个封装成example，写入这个文件
    for i in range(len(click_batch)):
        # 取出第i个样本的特征值和目标值，格式转换
        click = click_batch[i]
        feature = feature_batch[i].tostring()
        # [18.0, 0.09475817797242475, 0.0543921297305341...
        
        # 构造example，int64, float64, bytes
        example = tf.train.Example(features=tf.train.Features(feature={
            "label": tf.train.Feature(int64_list=tf.train.Int64List(value=[click])),
            "feature": tf.train.Feature(bytes_list=tf.train.BytesList(value=[feature]))
        }))
        
        # 序列化example,写入文件
        writer.write(example.SerializeToString())
    
    writer.close()

# 开启会话打印内容
with tf.Session() as sess:
    # 创建线程协调器
    coord = tf.train.Coordinator()

    # 开启子线程去读取数据
    # 返回子线程实例
    threads = tf.train.start_queue_runners(sess=sess, coord=coord)

    # 存入数据
    write_to_tfrecords(df.iloc[:, 2], df.iloc[:, 3])

    # 关闭子线程，回收
    coord.request_stop()

    coord.join(threads)
```

