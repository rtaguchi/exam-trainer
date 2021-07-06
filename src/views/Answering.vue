<template>
  <div class="home">
    <el-row>
      <el-col :span="2">
        <el-button type="text" icon="el-icon-d-arrow-left" @click="goToPrev" />
      </el-col>
      <el-col :span="20">
        <transition name="fade" mode="out-in">
          <div v-show="state.mainDisplay">
            <el-card>
              <template #header>
                <div class="card-header">
                  <el-row type="flex" justify="space-between">
                    {{ examTitle + ': Q' + currentQuestion.qNumber }}
                    <el-button 
                      size="small"
                      type="primary" 
                      round 
                      plain
                      @click="changeLang"
                    >
                      in {{ state.lang == 'ja' ? 'EN' : 'JA'}}
                    </el-button>
                  </el-row>
                </div>
              </template>
              <div class="card-body">
                <div class="v-html" v-html="currentQuestion.question[state.lang]" />
                <!-- <p v-for="phrase in currentQuestion.question.split('\n')" :key="phrase">
                  {{ phrase }}
                </p>   -->
              </div>
            </el-card>
            <el-card>
              <template v-for="(value, key) in currentQuestion.choices" :key="key">
                <!-- 複数回答であればチェックボックス -->
                <el-checkbox-group v-model="state.checked" v-if="currentQuestion.answer.length > 1">
                  <el-row type="flex" align="middle" :class="createRowColor(key)">
                    <el-col :span="1">
                      <el-checkbox :label="key" :disabled="state.isAnswer"><span></span></el-checkbox>
                    </el-col>
                    <el-col :span="23" class="choices" @click="acceptClickMulti(key)">
                      <p :class="createChoicesClass(key)">{{ value[state.lang] }}</p>
                    </el-col>
                  </el-row>
                </el-checkbox-group>
                <!-- 単数回答であればラジオボタン -->
                <el-radio-group v-model="state.selected" v-else>
                  <el-row type="flex" align="middle" :class="createRowColor(key)">
                    <el-col :span="1">
                      <el-radio :label="key" :disabled="state.isAnswer"><span></span></el-radio>
                    </el-col>
                    <el-col :span="23"  class="choices" @click="acceptClickSingle(key)">
                      <p :class="createChoicesClass(key)">{{ value[state.lang] }}</p>
                    </el-col>
                  </el-row>
                </el-radio-group>
                <el-divider></el-divider>
              </template>

              <el-row type="flex" justify="center">
                <el-col :span="16">
                  <el-button 
                    type="primary" plain 
                    icon="el-icon-check" 
                    class="under-button" 
                    v-if="!state.isAnswer" 
                    @click="answer"
                  />
                  <el-button :type="isCorrect?'success':'danger'" icon="el-icon-arrow-right" class="under-button" v-else @click="goToNext" />
                </el-col>
              </el-row>

              <el-row class="card-explanation" v-if="state.isAnswer">
                <p v-for="phrase in currentQuestion.explanation[state.lang].split('\n')" :key="phrase">
                  {{ phrase }}
                </p>  
                <el-col :span="20" v-for="disc in currentQuestion.discussion" :key="disc.username">
                  <discussion 
                    :comment="disc.comment[state.lang]"
                    :postedDate="disc.posted_date"
                    :upvotes="disc.upvotes"
                    :username="disc.username"
                    :key="disc.username"
                  ></discussion>
                </el-col>
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
      v-model="state.resultDialog" 
      width="60%" 
      :show-close="false" 
      :close-on-click-modal="false"
      top="10vh" 
      title="Set Complete!!"
    >
      <span class="result-text">{{ state.miniHistory.filter(value=>value.isCorrect).length }} / {{ state.miniHistory.length }}</span>
      <el-table :data="state.miniHistory" height="400" style="width: 100%" stripe>
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
import { defineComponent, computed, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router'
import { DateTime } from 'luxon'
import Discussion from '@/components/Discussion.vue'

interface MiniHistory {
  qNumber: number;
  partOfQ: string;
  isCorrect: boolean;
}

interface State {
  currentIndex: number;
  checked: string[];
  selected: string;
  isAnswer: boolean;
  resultDialog: boolean;
  miniHistory: MiniHistory[];
  mainDisplay: boolean;
  lang: string;
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
  components: {
    Discussion
  },
  setup(props, context){
    const router = useRouter()
    const state = reactive<State>({
      currentIndex: 0,
      checked: [],
      selected: '',
      isAnswer: false,
      resultDialog: false,
      miniHistory: [],
      mainDisplay: true,
      lang: 'ja'
    })

    const questionSetLength = computed(()=>props.questionSet?props.questionSet.length:0)
    const currentQuestion = computed(()=>props.questionSet?props.questionSet[state.currentIndex]:'')
    const checkedAndSelected = computed(()=>currentQuestion.value.answer.length>1?[...state.checked]:[state.selected])
    const isCorrect = computed(()=>{
      const ans = [...currentQuestion.value.answer]
      const cas = [...checkedAndSelected.value]
      return JSON.stringify(ans.sort()) == JSON.stringify(cas.sort())
    })
    const resultText = computed(()=>{
      const corrects = state.miniHistory.filter(value=>value.isCorrect).length 
      return corrects + ' / ' + state.miniHistory.length 
    })
    // Question からタグを除去
    const plainQuestion = computed(()=>{
      const el = document.createElement('html')
      el.innerHTML = currentQuestion.value.question[state.lang]
      const qString = el.getElementsByTagName('p')[0].textContent
      return qString ?? '' 
    })

    const acceptClickSingle = (key: string) => {
      if (state.isAnswer) { return }
      state.selected = key
    }
    const acceptClickMulti = (key: string) => {
      if (state.isAnswer) { return }
      const address = state.checked.indexOf(key)
      if (address >= 0){
        state.checked.splice(address, 1)
      } else {
        state.checked.push(key)
      }
    }
    const initialize = () => {
      state.selected = ''
      state.checked = []
      state.isAnswer = false
    }
    const changeLang = () => {
      if (state.lang === 'ja'){
        state.lang = 'en'
      } else {
        state.lang = 'ja'
      }
    }
    const goToNext = () => {
      if (state.currentIndex < questionSetLength.value - 1){
        state.mainDisplay = false
        setTimeout(()=>{
          state.mainDisplay = true
          state.currentIndex = state.currentIndex + 1
        }, 150)
      } else {
        state.resultDialog = true
      }
      initialize()
    }
    const goToPrev = () => {
      state.mainDisplay = false
      setTimeout(()=>{
        state.mainDisplay = true
        if (state.currentIndex > 0){
          state.currentIndex = state.currentIndex - 1
        } else {
          state.currentIndex = questionSetLength.value - 1
        }
      }, 150)
      initialize()
    }
    const createChoicesClass = (key: string) => {
      if (checkedAndSelected.value.includes(key)) {
        if (!state.isAnswer) {
          return 'selected-or-checked'
        } else {
          return ''
        }
      } else {
        return ''
      }
    }
    const createRowColor = (key: string) => {
      if (state.isAnswer && currentQuestion.value.answer.includes(key)) {
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
      state.isAnswer = true
      context.emit('updateAnswerHistory', currentQuestion.value.qNumber, isCorrect.value, DateTime.utc().toString())
      state.miniHistory.push({
        qNumber: currentQuestion.value.qNumber,
        partOfQ: plainQuestion.value.slice(0,150) + '...',
        // partOfQ: currentQuestion.value.question[state.lang].slice(0,150) + '...',
        isCorrect: isCorrect.value
      })
    }
    const returnSetting = () => {
      initialize()
      state.miniHistory = []
      state.resultDialog = false
      router.push({name: 'Setting'})
    }
    const oneMoreSet = () => {
      state.currentIndex = 0
      state.miniHistory = []
      state.resultDialog = false
      initialize()
    }

    onMounted(()=>{
      document.onkeydown = (e) => {
        if (!state.resultDialog) {
          if (e.key == 'Enter'){
            if (state.isAnswer) {
              goToNext()
            } else {
              answer()
            }
          } else if (e.key == 'ArrowRight'){
            goToNext()
          } else if (e.key == 'ArrowLeft'){
            goToPrev()
          }

          // 選択肢のキーバインド
          if (!state.isAnswer) {
            if (['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'].includes(e.key)){
              const upperKey = e.key.toUpperCase()
              if (upperKey in currentQuestion.value.choices) {
                if (currentQuestion.value.answer.length > 1){
                  acceptClickMulti(upperKey)
                } else {
                  acceptClickSingle(upperKey)
                }
              }
            }
          }
        }
      }
    })

    return {
      state,
      currentQuestion,
      acceptClickSingle,
      acceptClickMulti,
      changeLang,
      goToNext,
      goToPrev,
      createChoicesClass,
      createRowColor,
      isCorrect,
      answer,
      returnSetting,
      oneMoreSet,
      resultText,
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
  font-size: large;
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