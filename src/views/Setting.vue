<template>
  <div class="setting">
    <el-row justify="center">
      <el-col :span="24">
        <el-card header="Certification">
          <h1>{{ examTitle }}</h1>
        </el-card>
      </el-col>
    </el-row>

    <div v-if="questionList.length > 0">
      <el-row :gutter="10">
        <el-col :span="10">
          <el-card class="card-header" header="Questions / 1 Set" :body-style="{height:'42px'}">
            <el-radio-group v-model="qSet">
              <el-radio-button label="10"></el-radio-button>
              <el-radio-button label="20"></el-radio-button>
              <el-radio-button label="30"></el-radio-button>
              <el-radio-button label="40"></el-radio-button>
              <el-radio-button label="50"></el-radio-button>
            </el-radio-group>
          </el-card>
        </el-col>
        <el-col :span="10">
          <el-card header="Sorting" :body-style="{height:'42px'}">
            <el-select v-model="sortPattern">
              <el-option
                v-for="item in sortItems"
                :key="item.value"
                :label="item.text"
                :value="item.value">
              </el-option>
            </el-select>
            <el-radio-group v-model="sortOrder" v-if="sortPattern != 'nothing'">
              <el-radio-button label="ASC" ><i class="el-icon-caret-top"></i></el-radio-button>
              <el-radio-button label="DESC"><i class="el-icon-caret-bottom"></i></el-radio-button>
            </el-radio-group>

          </el-card>
        </el-col>
        <el-col :span="4">
          <el-card header="Options" :body-style="{height:'42px'}">
            <el-space direction="vertical" :size="4">
              <el-checkbox v-model="shuffleChoices" disabled>Shuffle Choices</el-checkbox>
              <el-checkbox v-model="onlyLatest" disabled>Only Latest</el-checkbox>
            </el-space>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="10">
        <el-col :span="12">
          <el-card header="Correct Answer Rate Filter" :body-style="{height:'42px'}">
            <el-tag
              v-for="rate in rates"
              :key="rate.name"
              closable
              :type="rate.type"
              @close="closeRateTab(rate)">
              {{rate.name}}
            </el-tag>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card header="Question Number Range Filter" :body-style="{height:'42px'}">
            <el-row>
            <el-col :offset="2" :span="20">
              <el-slider v-model="qRange" range :min="1" :max="questionList.length" />
            </el-col>
            </el-row>
          </el-card>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <h1>Filtered: {{ filteredQuestions.length }} / {{ questionList.length }}</h1>
        </el-col>
      </el-row>

      <el-row>
        <el-col :span="24">
          <el-button type="primary" @click="startTraining" :disabled="filteredQuestions.length<1">
            <i class="el-icon-reading" /> TRAINING START <i class="el-icon-reading" />
          </el-button>
        </el-col>
      </el-row>
    </div>

  </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, watch, PropType, onMounted, toRaw, Ref } from 'vue';
import { useRouter } from 'vue-router'
import { Question, AnswerHistory } from '@/@types/index'
import { DateTime } from 'luxon'
// import { TweenLite } from 'gsap'

const sortItems = [
    { value: 'qNumber', text: 'Question Number' },
    { value: 'lastAnswerDate', text: 'Last Challenged Date' },
    { value: 'correctRate', text: 'Correct Answer Rate' },
    { value: 'responses', text: 'Number of Responses' },
    { value: 'nothing', text: 'Nothing (Random)' },
  ]
const initialRates = [
  { name: 'Nothing', type: 'info' },
  { name: 'Poor', type: 'danger' },
  { name: 'Average', type: 'warning' },
  { name: 'Good', type: 'success'}
  ]

const qSet = ref("20")
const sortPattern = ref("qNumber")
const sortOrder = ref("ASC")
const shuffleChoices = ref(false)
const onlyLatest = ref(true)
const rates = ref(initialRates)
const qRange = ref([1, 1])

export default defineComponent({
  name: 'setting',
  props: {
    questionList: {
      type: Array as PropType<Question[]>
    },
    examTitle: {
      type: String
    },
    answerHistory: {
      type: Array as PropType<AnswerHistory[]>
    }
  },
  setup(props, context){
    const router = useRouter()

    if (props.questionList) {
      qRange.value = [qRange.value[0], props.questionList.length]
    }

    const filteredQuestions = computed(()=>{
      if (!props.questionList) {
        return []
      }
      const rangeFiltered = props.questionList.filter((value: Question)=>{
        return value.qNumber >= qRange.value[0] && value.qNumber <= qRange.value[1]
      })
      const withHistory = rangeFiltered.map((value: Question)=>{
        // 追加属性の初期値
        value['correctRateStatus'] = 'Nothing'
        value['correctRate'] = 0
        value['responses'] = 0
        value['lastAnswerDate'] = DateTime.fromISO('2001-01-01T00:00:00').toUTC()

        // 追加属性のマッピング
        const targetRecord = props.answerHistory?props.answerHistory.filter((hVal: AnswerHistory)=>hVal.qNumber==value.qNumber):[]
        if (targetRecord.length > 0){
          if (targetRecord[0].responses >= 3) {
            value['correctRate'] = targetRecord[0].corrects / targetRecord[0].responses
            if (value['correctRate'] < 0.3) {
              value['correctRateStatus'] = 'Poor'
            } else if (value['correctRate'] < 0.6) {
              value['correctRateStatus'] = 'Average'
            } else {
              value['correctRateStatus'] = 'Good'
            }
          }
          value['responses'] = targetRecord[0].responses
          value['lastAnswerDate'] = targetRecord[0].lastAnswerDate
        }
        return value
      })

      // 正答率のフィルタ
      const rateList = rates.value.map(value=>value.name)
      const ansRateFiltered = withHistory.filter(value=>{
        if (value.correctRateStatus) {
          return rateList.includes(value.correctRateStatus)
        }
      })

      // ソート
      const forSortList = [...ansRateFiltered]
      const listLength = forSortList.length
      if (sortPattern.value === 'nothing'){
        for (let i=listLength-1; i>=0; i--){
          const rand = Math.floor(Math.random() * (i + 1))
          const tmp = forSortList[i]
          forSortList[i] = forSortList[rand]
          forSortList[rand] = tmp
        }
        return forSortList
      }
      if (sortOrder.value == 'ASC'){
        return forSortList.sort((a: any, b: any)=>{
          if (a[sortPattern.value] == b[sortPattern.value]){
            return a['qNumber'] < b['qNumber'] ? -1 : 1
          } else {
            return a[sortPattern.value] < b[sortPattern.value] ? -1 : 1
          }
        })
      } else {
        return forSortList.sort((a: any, b: any)=>{
          if (a[sortPattern.value] == b[sortPattern.value]){
            return a['qNumber'] > b['qNumber'] ? -1 : 1
          } else {
            return a[sortPattern.value] > b[sortPattern.value] ? -1 : 1
          }
        })
      }
    })

    const closeRateTab = (rate: {name: string; type: string}) => {
      rates.value = rates.value.filter(val=>val!=rate)
      if (rates.value.length < 1) {
        rates.value = initialRates
      }
    }

    const pushedHoge = () => {
      console.log(filteredQuestions.value)
    }

    const startTraining = () => {
      if (!props.questionList) {
        return
      }
      const sortedQuestions = toRaw(filteredQuestions.value).slice(0, Number(qSet.value))
      context.emit('setFilteredQuestions', sortedQuestions)
      router.push({name: 'Answering'})
    }

    const numberOfQuestion = computed(()=>props.questionList?props.questionList.length:1)
    watch(numberOfQuestion, (newVal)=>{
      qRange.value[1] = newVal
    })

    return {
      sortItems,
      sortPattern,
      sortOrder,
      shuffleChoices,
      onlyLatest,
      qSet,
      rates,
      qRange,
      filteredQuestions,
      closeRateTab,
      startTraining,
      pushedHoge
    }
  }
})

</script>

<style>
.el-row {
  margin-bottom: 20px;
}

.el-row:last-child {
  margin-bottom: 0
}

div.el-card__header {
  padding: 5px;
  border: none;
  text-align: left;
  font-style: oblique; 
}
div.el-card__body {
  padding: 0px 5px 10px 5px;
}

.el-card__body h1 {
  margin: 0px;
}

div#options {
  text-align: left;
}

span.el-tag {
  margin: 5px
}


</style>