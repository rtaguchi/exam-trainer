<template>
  <div class="home">
    <el-row>
      <el-col :span="2">
        <el-button type="text" icon="el-icon-d-arrow-left" @click="goToPrev" />
      </el-col>
      <el-col :span="20">
        <transition name="fade" mode="out-in">
          <div v-show="mainDisplay">
            <el-card>
              <template #header>
                <div class="card-header">
                  {{ examTitle + ': Q' + currentQuestion.qNumber }}
                </div>
              </template>
              <div class="card-body">
                <p v-for="phrase in currentQuestion.question.split('\n')" :key="phrase">
                  {{ phrase }}
                </p>  
              </div>
            </el-card>
            <el-card>
              <template v-for="(value, key) in currentQuestion.choices" :key="key">
                <!-- 複数回答であればチェックボックス -->
                <el-checkbox-group v-model="checked" v-if="currentQuestion.answer.length > 1">
                  <el-row type="flex" align="middle" :class="createRowColor(key)">
                    <el-col :span="1">
                      <el-checkbox :label="key" :disabled="isAnswer"><span></span></el-checkbox>
                    </el-col>
                    <el-col :span="23" class="choices" @click="acceptClickMulti(key)">
                      <p :class="createChoicesClass(key)">{{ value }}</p>
                    </el-col>
                  </el-row>
                </el-checkbox-group>
                <!-- 単数回答であればラジオボタン -->
                <el-radio-group v-model="selected" v-else>
                  <el-row type="flex" align="middle" :class="createRowColor(key)">
                    <el-col :span="1">
                      <el-radio :label="key" :disabled="isAnswer"><span></span></el-radio>
                    </el-col>
                    <el-col :span="23"  class="choices" @click="acceptClickSingle(key)">
                      <p :class="createChoicesClass(key)">{{ value }}</p>
                    </el-col>
                  </el-row>
                </el-radio-group>
                <el-divider></el-divider>
              </template>

              <el-row type="flex" justify="center">
                <el-col :span="16">
                  <el-button type="primary" plain icon="el-icon-check" class="under-button" v-if="!isAnswer" @click="answer"/>
                  <el-button :type="isCorrect?'success':'danger'" icon="el-icon-arrow-right" class="under-button" v-else @click="goToNext" />
                </el-col>
              </el-row>

              <el-row class="card-explanation" v-if="isAnswer">
                <p v-for="phrase in currentQuestion.explanation.split('\n')" :key="phrase">
                  {{ phrase }}
                </p>  
              </el-row>

            </el-card>
          </div>
        </transition>
      </el-col>
      <el-col :span="2">
        <el-button type="text" icon="el-icon-d-arrow-right" @click="goToNext" />
      </el-col>
    </el-row>
    <el-row type="flex" justify="center">
      <el-col :span="4">
        <el-button type="primary" size="small" round @click="returnSetting">RETURN</el-button>
      </el-col>
    </el-row>

    <!-- 結果表示ダイアログ -->
    <el-dialog 
      v-model="resultDialog" 
      width="60%" 
      :show-close="false" 
      :close-on-click-modal="false"
      top="10vh" 
      title="Set Complete!!"
    >
      <span class="result-text">{{ miniHistory.filter(value=>value.isCorrect).length }} / {{ miniHistory.length }}</span>
      <el-table :data="miniHistory" height="400" style="width: 100%" stripe>
        <el-table-column property="qNumber" label="#" width="60"></el-table-column>
        <el-table-column property="partOfQ" label="Part of question"></el-table-column>
        <el-table-column property="isCorrect" label="Correct?" width="120">
          <template #default='scope'>
            <el-tag
              :type="scope.row.isCorrect?'success':'danger'"
              :effect="scope.row.isCorrect?'light':'plain'"
              disable-transitions
            >
              {{ scope.row.isCorrect?'CORRECT!!':'incorrect...'}}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="returnSetting">Finish</el-button>
          <el-button type="primary" @click="oneMoreSet">One More Set</el-button>
        </span>
      </template>
    </el-dialog>

  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, reactive } from 'vue';
import { useRouter } from 'vue-router'
import { DateTime } from 'luxon'
import { Question } from '@/@types/index'

interface MiniHistory {
  qNumber: number;
  partOfQ: string;
  isCorrect: boolean;
}

export default defineComponent({
  name: 'Answering',
  props: {
    questionSet: {
      type: Object
    },
    examTitle: {
      type: String
    }
  },

  setup(props, context){
    const router = useRouter()
    const currentIndex = ref<number>(0)
    const checked = ref<string[]>([])
    const selected = ref<string>()
    const isAnswer = ref(false)
    const resultDialog = ref(false)
    const miniHistory = ref<MiniHistory[]>([])
    const mainDisplay = ref(true)

    const questionSetLength = computed(()=>props.questionSet?props.questionSet.length:0)
    const currentQuestion = computed(()=>props.questionSet?props.questionSet[currentIndex.value]:'')
    const checkedAndSelected = computed(()=>[...checked.value, selected.value])
    const isCorrect = computed(()=>{
      const ans = [...currentQuestion.value.answer]
      const cas = [...checkedAndSelected.value]
      return JSON.stringify(ans.sort()) == JSON.stringify(cas.sort())
    })
    const resultText = computed(()=>{
      const corrects = miniHistory.value.filter(value=>value.isCorrect).length 
      return corrects + ' / ' + miniHistory.value.length 
    })

    const acceptClickSingle = (key: string) => {
      if (isAnswer.value) { return }
      selected.value = key
    }
    const acceptClickMulti = (key: string) => {
      if (isAnswer.value) { return }
      const address = checked.value.indexOf(key)
      if (address >= 0){
        checked.value.splice(address, 1)
      } else {
        checked.value.push(key)
      }
    }
    const initialize = () => {
      selected.value = ''
      checked.value = []
      isAnswer.value = false
    }
    const goToNext = () => {
      if (currentIndex.value < questionSetLength.value - 1){
        mainDisplay.value = false
        setTimeout(()=>{
          mainDisplay.value = true
          currentIndex.value = currentIndex.value + 1
        }, 150)
      } else {
        resultDialog.value = true
      }
      initialize()
    }
    const goToPrev = () => {
      mainDisplay.value = false
      setTimeout(()=>{
        mainDisplay.value = true
        if (currentIndex.value > 0){
          currentIndex.value = currentIndex.value - 1
        } else {
          currentIndex.value = questionSetLength.value - 1
        }
      }, 150)
      initialize()
    }
    const createChoicesClass = (key: string) => {
      if (checkedAndSelected.value.includes(key)) {
        if (!isAnswer.value) {
          return 'selected-or-checked'
        } else {
          return ''
        }
      } else {
        return ''
      }
    }
    const createRowColor = (key: string) => {
      if (isAnswer.value && currentQuestion.value.answer.includes(key)) {
        if (checkedAndSelected.value.includes(key)) {
          return 'row-correct'
        } else {
          return 'row-incorrect'
        } 
      } else {
        return ''
      }
    }
    const answer = () => {
      isAnswer.value = true
      context.emit('updateAnswerHistory', currentQuestion.value.qNumber, isCorrect.value, DateTime.utc())
      miniHistory.value.push({
        qNumber: currentQuestion.value.qNumber,
        partOfQ: currentQuestion.value.question.slice(0,150) + '...',
        isCorrect: isCorrect.value
      })
    }
    const returnSetting = () => {
      initialize()
      miniHistory.value = []
      resultDialog.value = false
      router.push({name: 'Setting'})
    }
    const oneMoreSet = () => {
      currentIndex.value = 0
      miniHistory.value = []
      resultDialog.value = false
      initialize()
    }
    return {
      currentQuestion,
      currentIndex,
      selected,
      checked,
      acceptClickSingle,
      acceptClickMulti,
      goToNext,
      goToPrev,
      createChoicesClass,
      createRowColor,
      isAnswer,
      isCorrect,
      answer,
      resultDialog,
      miniHistory,
      returnSetting,
      oneMoreSet,
      resultText,
      mainDisplay
    }
  }
});
</script>

<style scoped>
.result-text {
  font-size: xx-large;
  color: #409EFF;
}

.result-text img.emoji {
  height: 1.0em;
  width: 1.0em;
  margin: 0 .05em 0 .1em;
  vertical-align: -0.1em;
}

label.check-box {
  width: 100%;
}

.selected-or-checked {
  color: #409EFF
}

.under-button {
  margin: 10px 0px 0px 0px;
  width: 100%;
}

.el-radio-group {
  display: block;
}

.el-divider--horizontal {
  margin: 0;
}

.centering-check {
  display:block;
  position:relative;
}

.card-header {
  font-size: x-large;
  font-weight: bold;
  border-bottom: 1px solid lightgrey;
}
.card-body {
  text-align: left;
  margin: 20px 10px 15px 10px;
}

.card-body p {
  font-size: large;
  line-height: 1.8rem;
  padding: 0;
  margin: 1.5rem 0rem;
}

.card-explanation {
  text-align: left;
  margin: 0px 10px 10px 10px;
}

.card-explanation p {
  /* font-size: large; */
  line-height: 1.3rem;
  padding: 0;
  margin: 0.7rem 0rem;
}

.row-correct {
  background-color: #67C23A
}

.row-incorrect {
  background-color: #F56C6C
}


.choices {
  font-size: large;
  text-align: left;
  overflow-wrap: normal;
  line-height: 1.8rem;
  width: 100%;
  display: block;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-active {
  opacity: 0;
}

</style>