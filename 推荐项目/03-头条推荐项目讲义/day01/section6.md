# 2.7 Word2Vec与文章相似度

## 学习目标

- 目标
  - 知道文章向量计算方式
  - 了解Word2Vec模型原理
  - 知道文章相似度计算方式
- 应用
  - 应用Spark完成文章相似度计算

### 2.7.1 文章相似度

* 在我们的黑马头条推荐中有很多地方需要推荐相似文章，包括首页频道可以推荐相似的文章，详情页猜你喜欢

* 需求
  * 首页频道推荐：每个频道推荐的时候，会通过计算两两文章相似度，快速达到在线推荐的效果，比如用户点击文章，我们可以将离线计算好相似度的文章排序快速推荐给该用户。此方式也就可以解决冷启动的问题
* 方式：
  * 1、计算两两文章TFIDF之间的相似度
  * 2、计算两两文章的word2vec词向量相似度
    * 大量数据量的时候，加上使用LSH--(大数据量考虑）

词嵌入（word embeddings）已经在自然语言处理领域广泛使用我们采用第二种方式，实践中word2vec在大量数据下达到的效果更好。

### 2.7.2 什么是word2vec

#### 2.7.2.1 为什么介绍Word2Vec

图像和音频处理系统采用的是庞大的高维度数据集，对于图像数据来说，此类数据集会编码为单个原始像素强度的向量。不过，自然语言处理系统一直以来都将字词视为离散的原子符号，**将字词表示为唯一的离散ID还会导致数据稀疏性，并且通常意味着我们可能需要更多数据才能成功训练统计模型**。使用向量表示法可以扫除其中一些障碍。

#### 2.7.2.2 词的分布式表示（ distributed representation）

定义：将**文字**通过一串数字向量表示

* **词的独热表示**：One-hot Representation

NLP 中最直观，也是到目前为止最常用的词表示方法是 One-hot Representation，这种方法把每个词表示为一个很长的向量。这个向量的维度是词表大小，其中绝大多数元素为 0，只有一个维度的值为 1，这个维度就代表了当前的词。比如：

```
“灯泡”表示为 [0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 ...]  
“灯管”表示为 [0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 ...]
```

每个词都是茫茫 0 海中的一个 1。这种 One-hot Representation 如果采用稀疏方式存储，会是非常的简洁：也就是给每个词分配一个数字 ID。

* 特点：
  * 采用稀疏方式 存储，简单易实现
  * 1、向量的维度会随着句子的词的数量类型增大而增大；
  * 2、任意两个词之间都是孤立的，根本无法表示出在语义层面上词语词之间的相关信息，而这一点是致命的。

* **词的分布式表示**：Distributed representation

传统的独热表示（ one-hot representation）仅仅将词符号化，不包含任何语义信息。如何将语义融入到词表示中？Harris 在 1954 年提出的分布假说（ distributional hypothesis）为这一设想提供了理论基础：上下文相似的词，其语义也相似。

- Distributed representation 最早由 Hinton在 1986 年提出。它是一种低维实数向量，这种向量一般长成这个样子： [0.792, −0.177, −0.107, 0.109, −0.542, …]
- **最大的贡献就是让相关或者相似的词，在距离上更接近了**

#### 2.7.2.3 词的分布式方式

* 基于矩阵的分布表示
* 基于神经网络的分布表示，名称可以叫做**词向量**、**词嵌入（ word embedding）**或**分布式表示（ distributed representation）**
  * 实现方式：神经网络模型，如CBOW、Skip-gram
  * 实现工具:word2vec
    * 那么word2vec就是一种实现词向量的一个工具/方式，分布式词向量并不是word2vec的作者发明的，只是提出了一种更快更好的方式来训练语言模型。

* **一般说的word2vec词向量，指的是用word2vec训练出来的词向量**

### 2.7.2.4 word2vec原理

该部分将在后面讲完神经网络(深度学习)只介绍word2vec实现词向量的应用场景

- 计算相似度：寻找相似词、或者用于文章之间的相似度
- 文本生成、机器翻译等

实现相似度计算分解为一下几个步骤：

* 1、训练文章词向量模型
* 2、利用模型得到文章的平均词向量，存储到article_vector中
* 3、使用相似度计算工具进行文章之间的相似度计算

### 2.7.3 文章词向量训练

* 目的：通过大量历史文章数据，训练词的词向量

由于文章数据过多，在开始设计的时候我们会**分频道进行词向量训练，每个频道一个词向量模型。**

* 步骤：
  * 1、根据频道内容，读取不同频道号，获取相应频道数据并进行分词
  * 3、Spark Word2Vec训练保存模型

**根据频道内容，读取不同频道号，获取相应频道数据**

在setting目录汇总创建一个default.py文件，保存默认一些配置，如频道

```python
channelInfo = {
            1: "html",
            2: "开发者资讯",
            3: "ios",
            4: "c++",
            5: "android",
            6: "css",
            7: "数据库",
            8: "区块链",
            9: "go",
            10: "产品",
            11: "后端",
            12: "linux",
            13: "人工智能",
            14: "php",
            15: "javascript",
            16: "架构",
            17: "前端",
            18: "python",
            19: "java",
            20: "算法",
            21: "面试",
            22: "科技动态",
            23: "js",
            24: "设计",
            25: "数码产品",
        }
```

创建word2vec.ipynb文件，用来训练模型：

```python
import os
import sys
# 如果当前代码文件运行测试需要加入修改路径，避免出现后导包问题
BASE_DIR = os.path.dirname(os.path.dirname(os.getcwd()))
sys.path.insert(0, os.path.join(BASE_DIR))

PYSPARK_PYTHON = "/miniconda2/envs/reco_sys/bin/python"
# 当存在多个版本时，不指定很可能会导致出错
os.environ["PYSPARK_PYTHON"] = PYSPARK_PYTHON
os.environ["PYSPARK_DRIVER_PYTHON"] = PYSPARK_PYTHON

from offline import SparkSessionBase
from setting.default import channelInfo
from pyspark.ml.feature import Word2Vec



class TrainWord2VecModel(SparkSessionBase):

    SPARK_APP_NAME = "Word2Vec"
    SPARK_URL = "yarn"
    
    ENABLE_HIVE_SUPPORT = True

    def __init__(self):
        self.spark = self._create_spark_session()


w2v = TrainWord2VecModel()
```

获取数据并分词处理，注意分词函数导入(这里只选取了18号频道部分数据进行测试)

```python
# 这里训练一个频道模型演示即可
w2v.spark.sql("use article")
article = w2v.spark.sql("select * from article_data where channel_id=18 limit 2")
words_df = article.rdd.mapPartitions(segmentation).toDF(['article_id', 'channel_id', 'words'])
```

**Spark Word2Vec训练保存模型**

* 模块：from pyspark.ml.feature import Word2Vec
* API：class pyspark.ml.feature.Word2Vec(vectorSize=100, minCount=5, numPartitions=1, stepSize=0.025, maxIter=1, seed=None, inputCol=None, outputCol=None, windowSize=5, maxSentenceLength=1000)
  * vectorSize=100: 词向量长度
  * *minCount*：过滤次数小于默认5次的词
  * windowSize=5：训练时候的窗口大小
  * inputCol=None：输入列名
  * outputCol=None：输出列名

```python
new_word2Vec = Word2Vec(vectorSize=100, inputCol="words", outputCol="model", minCount=3)
new_model = new_word2Vec.fit(words_df)
new_model.save("hdfs://hadoop-master:9000/headlines/models/test.word2vec")
```

#### 上传历史数据训练的模型

在本地准备了训练一段时间每个频道的模型

```
hadoop dfs -put ./word2vec_model /headlines/models/
```

![](../images/hadoopwv目录.png)

### 2.7.4 增量更新-文章向量计算

有了词向量之后，我们就可以得到一篇文章的向量了，**为了后面快速使用文章的向量，我们会将每个频道所有的文章向量保存起来。**

* 目的：保存所有历史训练的文章向量
* 步骤：
  * 1、加载某个频道模型，得到每个词的向量
  * 2、获取频道的文章画像，得到文章画像的关键词(接着之前增量更新的文章article_profile)
  * 3、合并计算得到文章每个词的向量，计算平均词向量值即文章的向量

**加载某个频道模型，得到每个词的向量**

```python
from pyspark.ml.feature import Word2VecModel
channel_id = 18
channel = "python"
wv_model = Word2VecModel.load(
                "hdfs://hadoop-master:9000/headlines/models/word2vec_model/channel_%d_%s.word2vec" % (channel_id, channel))
vectors = wv_model.getVectors()
```

**获取新增的文章画像，得到文章画像的关键词**

可以选取小部分数据来进行测试

```python
# 选出新增的文章的画像做测试，上节计算的画像中有不同频道的，我们选取Python频道的进行计算测试
# 新增的文章画像获取部分
profile = w2v.spark.sql("select * from article_profile where channel_id=18 limit 10")
# profile = articleProfile.filter('channel_id = {}'.format(channel_id))

profile.registerTempTable("incremental")
articleKeywordsWeights = w2v.spark.sql(
                "select article_id, channel_id, keyword, weight from incremental LATERAL VIEW explode(keywords) AS keyword, weight")
_article_profile = articleKeywordsWeights.join(vectors, vectors.word==articleKeywordsWeights.keyword, "inner")
```

**计算得到文章每个词的向量**

* 这里用加入词的权重 * 词的向量 = weights x vector=new_vector，得到一个词的向量(包含了word2vec以及weights的结果)

```python
articleKeywordVectors = _article_profile.rdd.map(lambda row: (row.article_id, row.channel_id, row.keyword, row.weight * row.vector)).toDF(["article_id", "channel_id", "keyword", "weightingVector"])
```

**计算得到文章的平均词向量即文章的向量**

```python
def avg(row):
    x = 0
    for v in row.vectors:
        x += v
    #  将平均向量作为article的向量
    return row.article_id, row.channel_id, x / len(row.vectors)

articleKeywordVectors.registerTempTable("tempTable")
articleVector = w2v.spark.sql(
    "select article_id, min(channel_id) channel_id, collect_set(weightingVector) vectors from tempTable group by article_id").rdd.map(
    avg).toDF(["article_id", "channel_id", "articleVector"])
```

**对计算出的”articleVector“列进行处理，该列为Vector类型，不能直接存入HIVE，HIVE不支持该数据类型**

```python
def toArray(row):
    return row.article_id, row.channel_id, [float(i) for i in row.articleVector.toArray()]
    
articleVector = articleVector.rdd.map(toArray).toDF(['article_id', 'channel_id', 'articleVector'])
```

最终计算出这个18号Python频道的所有文章向量，保存到固定的表当中

* 创建文章向量表

```mysql
CREATE TABLE article_vector(
article_id INT comment "article_id",
channel_id INT comment "channel_id",
articlevector ARRAY<DOUBLE> comment "keyword");
```

保存数据到HIVE

```python
# articleVector.write.insertInto("article_vector")
```

#### 上传计算好的历史文章向量

```python
hadoop dfs -put ./article_vector /user/hive/warehouse/article.db/
```

### 2.7.5 文章相似度计算

* 目的：计算每个频道两两文章的相似度，并保存

* 分析问题：
  * 1、是否需要某频道计算所有文章两两相似度？
  * 2、相似度结果数值如何保存？

#### 2.7.4.1 问题1

我们在推荐相似文章的时候，其实并不会用到所有文章，也就是TOPK个相似文章会被推荐出去，经过排序之后的结果。如果我们的设备资源、时间也真充足的话，可以进行某频道全量所有的两两相似度计算。但是事实当文章量达到千万级别或者上亿级别，特征也会上亿级别，计算量就会很大。一下有两种类型解决方案

#### 1 每个频道的文章先进行聚类

可以对每个频道内N个文章聚成M类别，那么类别数越多每个类别的文章数量越少。如下pyspark代码

```python
bkmeans = BisectingKMeans(k=100, minDivisibleClusterSize=50, featuresCol="articleVector", predictionCol='group')
            bkmeans_model = bkmeans.fit(articleVector)
            bkmeans_model.save(
                "hdfs://hadoop-master:9000/headlines/models/articleBisKmeans/channel_%d_%s.bkmeans" % (channel_id, channel))
```

但是对于每个频道聚成多少类别这个M是超参数，并且聚类算法的时间复杂度并不小，当然可以使用一些优化的聚类算法二分、层次聚类。

#### 2 局部敏感哈希LSH(Locality Sensitive Hashing)

* 背景：

  * 从海量数据库中寻找到与查询数据相似的数据是一个很关键的问题。比如在图片检索领域，需要找到与查询图像相似的图，文本搜索领域都会遇到。如果是低维的小数据集，我们通过线性查找（Linear Search）就可以容易解决，但如果是对一个海量的高维数据集采用线性查找匹配的话，会非常耗时，因此，为了解决该问题，我们需要采用一些类似索引的技术来加快查找过程，通常这类技术称为**最近邻查找（Nearest Neighbor,AN），例如K-d tree；或近似最近邻查找（Approximate Nearest Neighbor, ANN），例如K-d tree with BBF, Randomized Kd-trees, Hierarchical K-means Tree。而LSH是ANN中的一类方法。**

  * 思路：
    * 如果能有一种算法，能将相似的字符串，从高维空间降维到一个相对低维的空间中。同时，在这个低维空间中，语法/语义相近的字符串的夹角余弦相对较小，也即语法/语义相近的字符串在降维后彼此较为接近。

说到Hash，大家都很熟悉，是一种典型的Key-Value结构，最常见的算法莫过于MD5。其设计思想是使Key集合中的任意关键字能够尽可能均匀的变换到Value空间中，不同的Key对应不同的Value，即使Key值只有轻微变化，Value值也会发生很大地变化。这样特性可以作为文件的唯一标识，在做下载校验时我们就使用了这个特性。

但是有没有这样一种Hash呢？他能够使相似Key值计算出的Value值相同或在某种度量下相近呢？甚至得到的Value值能够保留原始文件的信息，这样相同或相近的文件能够以Hash的方式被快速检索出来，或用作快速的相似性比对。局部敏感哈希（Locality Sensitive Hashing，LSH）正好满足了这种需求，在大规模数据处理中应用非常广泛，例如已下场景

- **近似检测（Near-duplicate detection）**：通常运用在网页去重方面。在搜索中往往会遇到内容相似的重复页面，它们中大多是由于网站之间转载造成的。可以对页面计算LSH，通过查找相等或相近的LSH值找到Near-duplicate。
- **图像、音频检索**：通常图像、音频文件都比较大，并且比较起来相对麻烦，我们可以事先对其计算LSH，用作信息指纹，这样可以给定一个文件的LSH值，快速找到与其相等或相近的图像和文件。
- **聚类**：将LSH值作为样本特征，将相同或相近的LSH值的样本合并在一起作为一个类别。

#### 什么是局部敏感哈希(Locality Sensitive Hashing，LSH)

经常使用的哈希函数，冲突总是难以避免。LSH却依赖于冲突，在解决NNS(Nearest neighbor search )时，我们期望：

![](../images/LSH不同的地方.png)

左图是传统Hash算法，右图是LSH。红色点和绿色点距离相近，橙色点和蓝色点距离相近。

- 传统Hash算法，得到的value值完全不一样

| 绿色点 1 0 0 0 0 0 0 0 | 红色点 0 0 0 0 1 0 0 0 |
| ---------------------- | ---------------------- |
| 橙色点 0 1 0 0 0 0 0 0 | 蓝色点 0 0 0 0 0 0 0 1 |

- LSH算法，红色点和绿色点的value值相等，橙色点和蓝色点的value值相近。

| 绿色点 0 0 1 0 0 0 0 0 | 红色点 0 0 0 0 0 1 0 0 |
| ---------------------- | ---------------------- |
| 橙色点 0 0 1 0 0 0 0 0 | 蓝色点 0 0 0 0 0 0 1 0 |

总结：离得越近的对象，发生冲突的概率越高；离得越远的对象，发生冲突的概率越低

维基百科对LSH的解释：LSH有几种不同的定义形式，那么其中定义最简单的一种形式叫：

* 定义：对于两个物体***u***,***v***（可以理解为两个文件、两个向量等），LSH生成的value值的每一bit位相等的概率等于这两个物体的相似度

表示成数学形式:

1. 如果d(u,v)相似度小，那么冲突概率Pr[h(u)=h(v)] ≥ p1

1. 如果d(u,v)相似度大，那么冲突概率Pr[h(u)=h(v)] ≥ p2

### LSH（局部敏感哈希）的实现

* 1、MinHash

* 2、基于随机投影的方式
  * 基于Stable Distribution的投影

#### 1、MinHash原理

MinHash首先它是一种基于 **Jaccard Index相似度的算法**，也是一种LSH的降维的方法，应用于大数据集的相似度检索、推荐系统。

* minHash的值相等的概率等于Jaccard相似度
* 原理过程：

假设我们有如下四个文档D1,D2,D3,D4D1,D2,D3,D4的集合情况,每个文档有相应的词项,用{w1,w2,..w7}{w1,w2,..w7}表示。若某个文档存在这个词项,则标为1，否则标为0。

![](../images/minihash.png)

**过程**

1、Minhash的定义为:特征矩阵按行进行一个随机的排列后,第一个列值为1的行的行号。

![](../images/minihash2.png)

* 重复上述操作
  * 矩阵按行进行多次置换,每次置换之后统计每一列(对应的是每个文档)第一个不为0位置的行号,这样每次统计的结果能构成一个与文档数等大的向量,我们称之为**签名向量**。
  * (如果两个文档足够相似,也就是说这两个文档中有很多元素是共有的,这样置换出来的签名向量,如果原来其中有一些文档的相似度很高,那么这些文档所对应的签名向量的相应的元素值相同的概率也很高。)

初始时的矩阵叫做input matrix,由m个文档m，n个词项组成.而把由t次置换后得到的一个t×m矩阵叫做signature matrix。

|        | D1   | D2   | D3   | D4   |
| ------ | ---- | ---- | ---- | ---- |
| 第一次 | 1    | 2    | 1    | 2    |
| 第二次 | 1    | 1    | 2    | 1    |
| ...    | ...  | ...  | ...  | ..   |
| 第S行  | ...  | ...  | ...  | ...  |

2、对**S行**Signature每行分割成若干brand（**一个brand若干行**）

每个band计算hash值（hash函数可以md5,sha1任意），我们需要将这些hash值做处理，使之成为事先设定好的hash桶的tag，然后把这些band“扔”进hash桶中。

![](../images/brand.png)

最终：两个文档一共存在b个band,这b个band都不相同的概率是，1−(1−s^r)^b（r和b影响对应的概率）

* 概率1−(1−s^r)^b就是最终两个文档被映射到同一个hash bucket中的概率。我们发现，这样一来，实际上可以通过控制参数r,b值来控制两个文档被映射到同一个哈希桶的概率。而且效果非常好。

比如，令b=20,r=5，s∈[0,1]是这两个文档的相似度，等于给的文当前提条件下：

* 假设原始两个文档相似，如当s=0.8时，两个文档被映射到同一个哈希桶的概率是
	* Pr(LSH(O1)=LSH(O2))=1−(1−0.85)5=0.9996439421094793
* 假设原始两个文档不相似，如当s=0.2时，两个文档被映射到同一个哈希桶的概率是： 
  * Pr(LSH(O1)=LSH(O2))=1−(1−0.25)5=0.0063805813047682

参数环境下的概率图：

![](../images/rb概率.png)

* 总结：
  * 相似度高于某个值的时候，到同一个桶概率会变得非常大，并且快速靠近1
  * 当相似度低于某个值的时候，概率会变得非常小，并且快速靠近0

#### 2、基于随机投影的方式(了解)

其思想在于高维空间中相近的物体，投影（降维）后也相近。我们看下图，三围空间中的四个点，红色圆形在三围空间中相近，绿色方块在三围空间中相距较远，那么投影后还是红色圆形相距较近，绿色方块相距较远.

![](../images/随机投影方式.png)

基于Stable Distribution的投影LSH，就是产生满足Stable Distribution的分布进行投影，最后将量化后的投影值作为value输出，具体数学表示形式如下： 给定特征向量***v***v，**Hash的每一bit的生成公式为**：

![](../images/投影公式.png)

* x是一个随机数，***x***⋅***v***就是投影；w值可以控制量化误差；b是随机扰动

**其LSH family将x特征向量映射到随机单位矢量v，并将映射结果分为哈希桶中。哈希表中的每个位置表示一个哈希桶。**

解释：还是上面的图形，

* 假设红色圆形在***x***方向上的投影是5和6，绿色方块在***x***方向上的投影值是1和8（发生了***x***⋅***v***操作）。这时，如果我们取b=0,w=2.5，那么红色圆形就Hash在一起（Hash值为2），绿色方块Hash在了不同的位置上（哈希值为0和3），满足了相似物体Hash到一起，不相似的物体Hash不在一起的需求。
* 但如果我们取w=3呢？这时绿色方块虽然没有Hash到在一起（Hash值为0和2），但红色圆形也没有hash到一起（Hash值为1和2）。怎么办呢？我们就可以通过b进行调节。为了防止这种情况一直发生，我们可以随机取b=1以增加扰动，这时红色圆形的Hash值就都为2了，而绿色方块的Hash值还是为0和2。

具体推导原理参考：<http://www.slaney.org/malcolm/yahoo/Slaney2008-LSHTutorial.pdf>

### 2.7.4.2 相似度计算

* 目的：计算18号Python频道的文章之间相似度
* 步骤：
  * 1、读取数据，进行类型处理(数组到Vector)
  * 2、BRP进行FIT得到距离

**读取数据，进行类型处理(数组到Vector)**

```python
from pyspark.ml.linalg import Vectors
# 选取部分数据做测试
article_vector = w2v.spark.sql("select article_id, articlevector from article_vector where channel_id=18 limit 10")
train = articlevector.select(['article_id', 'articleVector'])

def _array_to_vector(row):
    return row.article_id, Vectors.dense(row.articleVector)
    
train = train.rdd.map(_array_to_vector).toDF(['article_id', 'articleVector'])
```

**BRP进行FIT**

* class pyspark.ml.feature.BucketedRandomProjectionLSH(inputCol=None, outputCol=None, seed=None, numHashTables=1, bucketLength=None)
  * inputCol=None：输入特征列
  * outputCol=None：输出特征列
  * numHashTables=4：哈希表数量，几个hash function对数据进行hash操作
  * bucketLength=None：桶的数量，值越大相同数据进入到同一个桶的概率越高
  * method:
    * approxSimilarityJoin(df1, df2, 2.0, distCol='EuclideanDistance')
    * 计算df1每个文章相似的df2数据集的数据

![](../images/LSH官方图.png)

```python
from pyspark.ml.feature import BucketedRandomProjectionLSH

# 默认4，10，官方推荐使用大小
brp = BucketedRandomProjectionLSH(inputCol='articleVector', outputCol='hashes', numHashTables=4.0, bucketLength=10.0)
model = brp.fit(train)
```

计算相似的文章以及相似度

```python
similar = model.approxSimilarityJoin(test, train, 2.0, distCol='EuclideanDistance')

similar.sort(['EuclideanDistance']).show()
```

### 2.7.4.3 问题3

对于计算出来的相似度，是要在推荐的时候使用。那么我们所知的是，HIVE只适合在离线分析时候使用，因为运行速度慢，所以只能将相似度存储到HBASE当中

* hbase

### 2.7.5 文章相似度存储

* 目的：将所有文章对应相似度文章及其相似度保存

* 步骤：
  * 调用foreachPartition
    * **foreachPartition不同于map和mapPartition，主要用于离线分析之后的数据落地，如果想要返回新的一个数据DF，就使用map后者。**

我们需要建立一个HBase存储文章相似度的表

```python
create 'article_similar', 'similar'

# 存储格式如下：key:为article_id, 'similar:article_id', 结果为相似度
put 'article_similar', '1', 'similar:1', 0.2
put 'article_similar', '1', 'similar:2', 0.34
put 'article_similar', '1', 'similar:3', 0.267
put 'article_similar', '1', 'similar:4', 0.56
put 'article_similar', '1', 'similar:5', 0.7
put 'article_similar', '1', 'similar:6', 0.819
put 'article_similar', '1', 'similar:8', 0.28
```

定义保存HBASE函数，确保我们的happybase连接hbase启动成功，Thrift服务打开。hbase集群出现退出等问题常见原因，配置文件hadoop目录，地址等，还有

* ntpdate 0.cn.pool.ntp.org或者ntpdate ntp1.aliyun.com
* hbase-daemon.sh start thrift

```python
def save_hbase(partition):
    import happybase
    pool = happybase.ConnectionPool(size=3, host='hadoop-master')
    
    with pool.connection() as conn:
        # 建议表的连接
        table = conn.table('article_similar')
        for row in partition:
            if row.datasetA.article_id == row.datasetB.article_id:
                pass
            else:
                table.put(str(row.datasetA.article_id).encode(),
                         {"similar:{}".format(row.datasetB.article_id).encode(): b'%0.4f' % (row.EuclideanDistance)})
        # 手动关闭所有的连接
        conn.close()

similar.foreachPartition(save_hbase)
```



