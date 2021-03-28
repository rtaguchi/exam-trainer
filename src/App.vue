<template>
  <el-container>
    <el-header>
    </el-header>
    <el-main>
      <router-view
        :questionList="questionList"
        :examTitle="examTitle"
        :answerHistory="history"
        :questionSet="questionSet"  
        @setFilteredQuestions="setFilteredQuestions"
        @updateAnswerHistory="updateAnswerHistory"
      />
    </el-main>
  </el-container>
</template>


<script lang="ts">
import { defineComponent, computed, ref, onMounted, toRaw, Ref } from 'vue';
import { setState, getState, deleteState } from '@/storage'
import { Question, AnswerHistory } from '@/@types/index'
import { DateTime } from 'luxon'

export default defineComponent({
  name: 'App',
  setup(){
    const questionList = ref<Question[]>([])
    const questionSet = ref<Question[]>([])
    const examTitle = ref('(No Data)')
    const history = ref<AnswerHistory[]>([])

    window.myAPI.openData(async (args: string[])=>{
      questionList.value = JSON.parse(args[0])
      examTitle.value = args[1]
      const temporary = await getState(examTitle.value)
      if (temporary) {
        history.value = temporary
      }
      console.log('Load complete.')
    })
    window.myAPI.deleteData(async ()=>{
      deleteState()
      console.log('Delete complete.')
    })

    const setFilteredQuestions = (filteredQuestions: Question[]) => {
      questionSet.value = filteredQuestions
    }

    const updateAnswerHistory = (qNumber: number, isCorrect: boolean, answerDate: DateTime) => {
      const updateTarget = history.value?history.value.filter((value)=>value.qNumber==qNumber):[]
      if (updateTarget.length==0) {
        history.value.push({
          qNumber: qNumber,
          responses: 1,
          corrects: isCorrect?1:0,
          lastAnswerDate: answerDate
        })
      } else {
        const index = history.value.indexOf(updateTarget[0])
        history.value[index].responses++
        history.value[index].corrects = isCorrect?history.value[index].corrects+1:history.value[index].corrects
        history.value[index].lastAnswerDate = answerDate
      }
      setState(examTitle.value, toRaw(history.value))
    }

    return {
      questionList,
      questionSet,
      examTitle,
      history,
      setFilteredQuestions,
      updateAnswerHistory
    }
  }
})

</script>


<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

#nav {
  padding: 30px;
}

#nav a {
  font-weight: bold;
  color: #2c3e50;
}

#nav a.router-link-exact-active {
  color: #42b983;
}
</style>
