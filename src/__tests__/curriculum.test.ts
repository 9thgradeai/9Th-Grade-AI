import { describe, it, expect } from 'vitest'
import { validateCurriculum, bcsPreliminaryCurriculum } from '@/domains/exams/curriculum/validation'

describe('BCS Preliminary Curriculum Integrity', () => {
  it('has exactly 10 subjects', () => {
    const result = validateCurriculum()
    expect(result.stats.subjectCount).toBe(10)
  })

  it('total marks equals 200', () => {
    const result = validateCurriculum()
    expect(result.stats.totalMarks).toBe(200)
  })

  it('subject order matches supplied syllabus', () => {
    const subjects = bcsPreliminaryCurriculum.subjects
    expect(subjects[0].name).toBe('বাংলা ভাষা ও সাহিত্য')
    expect(subjects[1].name).toBe('English Language and Literature')
    expect(subjects[2].name).toBe('বাংলাদেশ বিষয়াবলি')
    expect(subjects[3].name).toBe('আন্তর্জাতিক বিষয়াবলি')
    expect(subjects[4].name).toBe('ভূগোল (বাংলাদেশ ও বিশ্ব), পরিবেশ ও দুর্যোগ ব্যবস্থাপনা')
    expect(subjects[5].name).toBe('সাধারণ বিজ্ঞান')
    expect(subjects[6].name).toBe('কম্পিউটার ও তথ্য প্রযুক্তি')
    expect(subjects[7].name).toBe('গাণিতিক যুক্তি')
    expect(subjects[8].name).toBe('মানসিক দক্ষতা')
    expect(subjects[9].name).toBe('নৈতিকতা, মূল্যবোধ ও সু-শাসন')
  })

  it('subject marks match supplied syllabus', () => {
    const subjects = bcsPreliminaryCurriculum.subjects
    expect(subjects[0].marks).toBe(30)
    expect(subjects[1].marks).toBe(30)
    expect(subjects[2].marks).toBe(25)
    expect(subjects[3].marks).toBe(25)
    expect(subjects[4].marks).toBe(10)
    expect(subjects[5].marks).toBe(15)
    expect(subjects[6].marks).toBe(15)
    expect(subjects[7].marks).toBe(20)
    expect(subjects[8].marks).toBe(15)
    expect(subjects[9].marks).toBe(15)
  })

  it('passes curriculum validation', () => {
    const result = validateCurriculum()
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('has no duplicate IDs', () => {
    const result = validateCurriculum()
    const idErrors = result.errors.filter(e => e.includes('Duplicate'))
    expect(idErrors).toHaveLength(0)
  })

  it('has correct section count for Bangladesh Affairs', () => {
    const bd = bcsPreliminaryCurriculum.subjects.find(s => s.id === 'bcs-03-bangladesh-affairs')
    expect(bd?.sections.length).toBe(9)
  })

  it('has correct section count for International Affairs', () => {
    const intl = bcsPreliminaryCurriculum.subjects.find(s => s.id === 'bcs-04-international')
    expect(intl?.sections.length).toBe(5)
  })

  it('has correct section count for Geography', () => {
    const geo = bcsPreliminaryCurriculum.subjects.find(s => s.id === 'bcs-05-geography')
    expect(geo?.sections.length).toBe(5)
  })

  it('has correct section count for Ethics', () => {
    const ethics = bcsPreliminaryCurriculum.subjects.find(s => s.id === 'bcs-10-ethics')
    expect(ethics?.sections.length).toBe(3)
  })
})
