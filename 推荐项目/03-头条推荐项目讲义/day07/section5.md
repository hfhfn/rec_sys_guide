# 7.5 案例：DNN文本多分类

## 学习目标

- 目标
  - 无
- 应用
  - 应用tf estimator完成文本分类

### 7.5.1 IMDB电影评论文本的神经网络分类

- 目的：对IMDB电影评论数据进行训练，预测分类
- 步骤：
  - 1、电影评论数据读取
  - 2、模型输入特征列指定
  - 3、模型训练与保存

**1、电影评论数据读取**

我们将要使用的数据集是 IMDB Large Movie Review Dataset，包含用于训练的 25000 段带有明显情感倾向的电影评论，测试集有 25000 段。我们将会用此数据集训练一个二分类模型，用于判断一篇评论是积极的还是消极的。

比如一个负面评论（2 颗星）的片段：

> Now, I LOVE Italian horror films. The cheesier they are, the better. However, this is not cheesy Italian. This is week-old spaghetti sauce with rotting meatballs. It is amateur hour on every level. There is no suspense, no horror, with just a few drops of blood scattered around to remind you that you are in fact watching a horror film.

我们用 0 将所有句子补齐到相同长度，这样对于训练集和测试集我们就分别有一个两维的 25000×200 的数组。

```python
# 指定总共多少不同的词，每个样本的序列长度最大多少
from tensorflow import keras
vocab_size = 5000
sentence_size = 200


def get_train_test():
    """
    获取电影评论文本数据
    :return:
    """
    imdb = keras.datasets.imdb

    (x_train_source, y_train), (x_test_source, y_test) = imdb.load_data(num_words=5000)

    # 每个样本评论序列长度固定
    x_train = keras.preprocessing.sequence.pad_sequences(x_train_source,
                                                         maxlen=max_sentence,
                                                         padding='post', value=0)
    x_test = keras.preprocessing.sequence.pad_sequences(x_test_source,
                                                         maxlen=max_sentence,
                                                         padding='post', value=0)

    return (x_train, y_train), (x_test, y_test)
```

- 填充序列pad_sequences

```
keras.preprocessing.sequence.pad_sequences(sequences, maxlen=None, dtype='int32',
    padding='pre', truncating='pre', value=0.)
```

将长为`nb_samples`的序列转化为形如`(nb_samples,nb_timesteps)`2D numpy array。如果提供了参数`maxlen`，`nb_timesteps=maxlen`，否则其值为最长序列的长度。其他短于该长度的序列都会在后部填充0以达到该长度。长于`nb_timesteps`的序列将会被截断，以使其匹配目标长度。padding和截断发生的位置分别取决于`padding`和`truncating`.

### 参数

- sequences：浮点数或整数构成的两层嵌套列表
- maxlen：None或整数，为序列的最大长度。大于此长度的序列将被截短，小于此长度的序列将在后部填0.
- dtype：返回的numpy array的数据类型
- padding：‘pre’或‘post’，确定当需要补0时，在序列的起始还是结尾补
- truncating：‘pre’或‘post’，确定当需要截断序列时，从起始还是结尾截断
- value：浮点数，此值将在填充时代替默认的填充值0

**2、Input Functions的定义**

```python
def parser(x, y):
    features = {"feature": x}
    return features, y

def train_input_fn():
    dataset = tf.data.Dataset.from_tensor_slices((x_train, y_train))
    dataset = dataset.shuffle(buffer_size=25000)
    dataset = dataset.batch(64)
    dataset = dataset.map(parser)
    dataset = dataset.repeat()
    return dataset


def eval_input_fn():
    dataset = tf.data.Dataset.from_tensor_slices((x_test, y_test))
    dataset = dataset.batch(64)
    dataset = dataset.map(parser)
    return dataset
```

> 注：要在 `input_fn` 中使用 `Dataset`（input_fn 属于 [`tf.estimator.Estimator`](https://www.tensorflow.org/api_docs/python/tf/estimator/Estimator?hl=zh-CN)），只需返回 `Dataset` 即可，框架将负责创建和初始化迭代器。

**2、模型输入特征列指定**

指定特征列

```python
column = tf.feature_column.categorical_column_with_identity('feature', vocab_size)

embedding_size = 50
word_embedding_column = tf.feature_column.embedding_column(
    column, dimension=embedding_size
)
```

**3、进行模型训练**

指定模型的神经网络的神经元数量，以及几层；

* 参数model_dir：模型输出目录指定

```python
classifier = tf.estimator.DNNClassifier(
    hidden_units=[100],
    feature_columns=[word_embedding_column],
    model_dir='./tmp/embeddings'
)

classifier.train(input_fn=train_input_fn, steps=25000)
eval_results = classifier.evaluate(input_fn=eval_input_fn)
print(eval_results)
```