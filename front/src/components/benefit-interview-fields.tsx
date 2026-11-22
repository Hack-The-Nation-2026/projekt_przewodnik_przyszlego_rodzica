import { useFieldArray, useFormContext } from 'react-hook-form'
import type { FieldPath } from 'react-hook-form'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { ChoiceSelect } from '@/components/ui/choice-select'
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { InfoHint } from '@/components/ui/info-hint'
import { Input } from '@/components/ui/input'
import { activeChildren, isPlacement, sicknessYears } from '@/lib/interview-form'
import type { InterviewValues } from '@/lib/interview-form'

type Choice = readonly [value: string, label: string]

const answers = [['unknown', 'Nie wiem'], ['yes', 'Tak'], ['no', 'Nie']] as const
const fieldsGrid = 'grid gap-5 sm:grid-cols-2'

function Field({
  name,
  label,
  type = 'text',
  choices,
  hint,
  explain,
  inputMode,
}: {
  name: FieldPath<InterviewValues>
  label: string
  type?: 'text' | 'date'
  choices?: readonly Choice[]
  hint?: string
  explain?: string
  inputMode?: 'decimal' | 'numeric'
}) {
  const { control } = useFormContext<InterviewValues>()
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center gap-1.5">
            <FormLabel>{label}</FormLabel>
            {explain && <InfoHint label={label}>{explain}</InfoHint>}
          </div>
          <FormControl>
            {choices ? (
              <ChoiceSelect
                value={String(field.value)}
                onValueChange={field.onChange}
                choices={choices}
                field={String(name)}
              />
            ) : (
              <Input {...field} value={String(field.value)} type={type} inputMode={inputMode} />
            )}
          </FormControl>
          {hint && <FormDescription>{hint}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function YesNo({
  name,
  label,
  hint,
  explain,
}: {
  name: FieldPath<InterviewValues>
  label: string
  hint?: string
  explain?: string
}) {
  return <Field name={name} label={label} choices={answers} hint={hint} explain={explain} />
}

function Check({
  name,
  label,
  explain,
}: {
  name: FieldPath<InterviewValues>
  label: string
  explain?: string
}) {
  const { control } = useFormContext<InterviewValues>()
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="flex min-h-8 items-center gap-3">
            <FormControl>
              <input
                type="checkbox"
                name={field.name}
                checked={field.value === true}
                onChange={(event) => field.onChange(event.target.checked)}
                onBlur={field.onBlur}
                ref={field.ref}
                className="size-5 shrink-0 accent-primary"
              />
            </FormControl>
            <FormLabel>{label}</FormLabel>
            {explain && <InfoHint label={label}>{explain}</InfoHint>}
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

function ChildFields({ index, values, multiple }: { index: number; values: InterviewValues; multiple: boolean }) {
  const { control, formState: { errors } } = useFormContext<InterviewValues>()
  const name = `children.${index}.stays` as const
  const { fields, append, remove } = useFieldArray({ control, name })
  const stayError = errors.children?.[index]?.stays?.message ?? errors.children?.[index]?.stays?.root?.message
  return (
    <fieldset className="space-y-4 rounded-md border border-border px-4 pb-4">
      <legend className="px-2 text-sm font-semibold">{multiple ? `Dziecko ${index + 1}` : 'Dane dziecka'}</legend>
      {isPlacement(values) && (
        <div className={fieldsGrid}>
          <Field name={`children.${index}.birthDate`} label="Data urodzenia dziecka" type="date" />
          {values.role === 'foster' && <Check name={`children.${index}.schoolDeferred`} label="Odroczono obowiązek szkolny" />}
        </div>
      )}
      {!isPlacement(values) && (
        <div className={fieldsGrid}>
          <Check name={`children.${index}.stillborn`} label="Dziecko urodziło się martwe" />
          <Field
            name={`children.${index}.deathDate`}
            label="Data zgonu dziecka"
            type="date"
            hint="Wypełnij, jeśli dziecko zmarło po urodzeniu. Zasiłek macierzyński przysługuje wtedy jeszcze przez osiem tygodni."
          />
        </div>
      )}
      {values.hospitalization === 'yes' && (
        <div className="space-y-4">
          <Field name={`children.${index}.weight`} label="Masa urodzeniowa w gramach" inputMode="numeric" hint="Podaj, jeśli ją znasz." />
          {fields.map(({ id }, stayIndex) => (
            <fieldset key={id} className="space-y-3 rounded-md bg-muted p-3">
              <legend className="px-2 text-sm font-medium">Pobyt {stayIndex + 1}</legend>
              <div className={fieldsGrid}>
                <Field name={`${name}.${stayIndex}.start`} label="Początek pobytu" type="date" />
                <Field name={`${name}.${stayIndex}.end`} label="Koniec pobytu" type="date" />
              </div>
              <Button type="button" size="sm" variant="outline" onClick={() => remove(stayIndex)}>
                Usuń pobyt {stayIndex + 1}
              </Button>
            </fieldset>
          ))}
          {fields.length < 30 && (
            <Button type="button" variant="outline" size="sm" onClick={() => append({ start: '', end: '' })}>
              Dodaj pobyt w szpitalu
            </Button>
          )}
          {stayError && <p role="alert" className="text-sm text-destructive">{stayError}</p>}
        </div>
      )}
    </fieldset>
  )
}

/**
 * Pierwszy ekran decyduje o całej reszcie: od razu pytamy, na jakim etapie
 * jest sprawa. Trzecia odpowiedź prowadzi do trybu planowania, a czwarta do
 * trybu „jestem w trakcie urlopu”, bo te dwie sytuacje mają własne ekrany.
 */
export function RoleFields({ values }: { values: InterviewValues }) {
  const family = values.role === 'mother' || values.role === 'father'
  return (
    <div className={fieldsGrid}>
      <Field name="role" label="Twoja rola" choices={[
        ['mother', 'Matka dziecka'], ['father', 'Ojciec dziecka'],
        ['adoption', 'Rodzic adopcyjny'], ['foster', 'Rodzic zastępczy'],
      ]}
        explain="Na tej podstawie dobierzemy pytania o Twoją sytuację." />
      {family && <Field name="birthStage" label="Na jakim etapie jesteście" choices={[
        ['expected', 'Jesteśmy w ciąży'],
        ['born', 'Dziecko już się urodziło'],
        ['planning', 'Dopiero planujemy dziecko'],
        ['on_leave', 'Jestem w trakcie urlopu'],
      ]}
        explain="Trzecia odpowiedź otwiera tryb planowania, a czwarta tryb „jestem w trakcie urlopu”. W obu pytamy tylko o teraźniejszość." />}
    </div>
  )
}

export function FamilyEventFields({ values }: { values: InterviewValues }) {
  const placement = isPlacement(values)
  return (
    <div className={fieldsGrid}>
      <Field
        name="eventDate"
        label={placement ? 'Data przyjęcia dziecka na wychowanie'
          : values.birthStage === 'expected' ? 'Przewidywana data porodu' : 'Data porodu'}
        type="date"
        explain="Data z karty ciąży albo z aktu urodzenia. Od niej liczą się terminy urlopów."
      />
      <Field name="childCount" label="Liczba dzieci przy tym zdarzeniu" inputMode="numeric"
        explain="Ile dzieci urodziło się lub urodzi przy tym porodzie. Przy bliźniakach urlop jest dłuższy." />
    </div>
  )
}

export function ChildQuestions({ values }: { values: InterviewValues }) {
  const placement = isPlacement(values)
  return (
    <>
      {placement && <YesNo name="placementConfirmed" label={values.role === 'adoption'
        ? 'Czy złożono w sądzie wniosek o przysposobienie?' : 'Czy sprawujesz niezawodową pieczę zastępczą?'} />}
      {values.role === 'adoption' && <YesNo name="adoptiveFather" label="Czy jesteś ojcem adopcyjnym?" />}
      {values.role === 'adoption' && values.adoptiveFather === 'yes' && (
        <Field name="adoptionOrderDate" label="Data uprawomocnienia przysposobienia" type="date" />
      )}
      {values.role === 'father' && (
        <YesNo name="takingOver" label="Czy przejmujesz opiekę i pozostały macierzyński od matki?"
          explain="Ojciec może przejąć resztę urlopu macierzyńskiego, gdy matka wraca do pracy albo nie może zajmować się dzieckiem." />
      )}
      {values.role === 'father' && values.takingOver === 'yes' && (
        <Field name="takeoverDate" label="Data przejęcia macierzyńskiego" type="date" />
      )}
      <Check name="zaZyciem" label="Dziecko ma zaświadczenie „Za życiem”"
        explain="Zaświadczenie wydaje szpital, gdy dziecko ma ciężką wadę rozwojową. Daje dłuższy urlop rodzicielski." />
      <YesNo name="hospitalization" label="Czy dziecko wymagało pobytu w szpitalu po urodzeniu lub przyjęciu?"
        explain="Chodzi o pobyt dziecka w szpitalu zaraz po urodzeniu. Taki pobyt daje dodatkowy urlop uzupełniający." />
    </>
  )
}

export function ChildDetails({ values }: { values: InterviewValues }) {
  const children = activeChildren(values)
  return (
    <>
      {values.hospitalization === 'yes' && (
        <Field name="pregnancyWeeks" label="Ukończony tydzień ciąży w chwili porodu" inputMode="numeric" hint="Podaj, jeśli go znasz." />
      )}
      {children.map((_, index) => (
        <ChildFields key={index} index={index} values={values} multiple={children.length > 1} />
      ))}
    </>
  )
}

export function EmploymentFields({ values }: { values: InterviewValues }) {
  return (
    <>
      <div className={fieldsGrid}>
        <Field name="employment" label="Rodzaj zatrudnienia" choices={[
          ['unknown', 'Nie wiem / wybierz'], ['employee', 'Umowa o pracę'],
          ['contractor', 'Umowa zlecenia'], ['self_employed', 'Działalność gospodarcza'],
          ['other', 'Inna sytuacja'],
        ]}
          explain="Umowa o pracę daje prawo do zasiłku z ZUS. Przy umowie zlecenia potrzebne jest ubezpieczenie chorobowe." />
        <YesNo name="insured" label="Czy w dniu powstania prawa masz ubezpieczenie chorobowe?"
          explain="To ubezpieczenie, z którego ZUS płaci zasiłek. Przy umowie o pracę pracodawca zgłasza Cię do niego automatycznie." />
        <Field name="basis" label="Miesięczna podstawa wymiaru w zł" inputMode="decimal"
          hint="Jeśli znasz podstawę używaną do wyliczenia zasiłku, wpisz ją tutaj." />
        {values.employment === 'self_employed' && (
          <YesNo name="arrears" label="Czy zaległość składkowa przekracza próg uwzględniany przez ZUS?" />
        )}
      </div>
      <Check name="employmentEnded" label="Zatrudnienie ustało lub jest znana data jego zakończenia" />
      {values.role === 'mother' && values.employment === 'employee' && (
        <Accordion type="single" collapsible className="rounded-md border border-input">
          <AccordionItem value="employment-changes">
            <AccordionTrigger>Zmiany zatrudnienia lub wynagrodzenia w ciąży (opcjonalnie)</AccordionTrigger>
            <AccordionContent className={fieldsGrid}>
              <YesNo name="newContractDuringPregnancy" label="Czy w ciąży zawarłaś nową umowę o pracę?" />
              {values.newContractDuringPregnancy === 'yes' && (
                <YesNo name="workPerformedUnderContract" label="Czy wykonywałaś pracę na podstawie tej umowy?" />
              )}
              <YesNo name="payRaisedDuringPregnancy" label="Czy dostałaś podwyżkę w ciąży?" />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </>
  )
}

export function EmploymentEndFields({ values }: { values: InterviewValues }) {
  return (
    <div className={fieldsGrid}>
      <Field name="employmentEndDate" label="Ostatni dzień zatrudnienia" type="date" />
      {values.role === 'mother' && <YesNo name="endedDuringPregnancy" label="Czy zatrudnienie ustało w ciąży?" />}
      {values.role === 'mother' && values.endedDuringPregnancy === 'yes' && (
        <>
          <Field name="endReason" label="Przyczyna ustania zatrudnienia" choices={[
            ['unknown', 'Nie wiem / wybierz'], ['death', 'Śmierć pracodawcy'],
            ['bankruptcy', 'Upadłość pracodawcy'], ['liquidation', 'Likwidacja pracodawcy'],
            ['unlawful_court_ruling', 'Rozwiązanie z naruszeniem prawa potwierdzone przez sąd'],
            ['other', 'Inna przyczyna'],
          ]} />
          <YesNo name="replacementEmployment" label="Czy zapewniono Ci inne zatrudnienie?" />
        </>
      )}
      {values.role === 'mother' && values.employment === 'employee' && (
        <Check name="extendedToBirth" label="Umowę przedłużono do dnia porodu" />
      )}
    </div>
  )
}

export function ReturnFields({ values }: { values: InterviewValues }) {
  return (
    <>
      {values.employment === 'employee' && (
        <Check name="workingOnLeave" label="Chcę łączyć urlop rodzicielski z pracą u tego samego pracodawcy"
          explain="Możesz pracować na część etatu i dalej dostawać zasiłek. Urlop wydłuża się wtedy proporcjonalnie." />
      )}
      <div className={fieldsGrid}>
        <Field name="returnDate" type="date" label="Planowana data powrotu do pracy"
          hint={values.workingOnLeave && values.employment === 'employee'
            ? 'Podaj datę rozpoczęcia łączenia pracy z rodzicielskim.' : 'Opcjonalnie, do podsumowania.'} />
        {values.workingOnLeave && values.employment === 'employee' && (
          <>
            <Field name="workPercent" label="Praca na urlopie w % pełnego etatu" inputMode="decimal" hint="Maksymalnie 50%."
              explain="Ile etatu przepracujesz w czasie urlopu. Przepisy pozwalają na najwyżej połowę." />
            <Field name="contractedPercent" label="Wymiar pracy na umowie w % pełnego etatu" inputMode="decimal"
              explain="Wymiar z Twojej umowy. Przy pełnym etacie wpisz 100." />
            <Field name="parentalDays" label="Dni rodzicielskiego w części łączonej z pracą" inputMode="numeric"
              hint="Podaj liczbę dni przed wydłużeniem urlopu." />
          </>
        )}
      </div>
    </>
  )
}

export function PartnerFields({ values }: { values: InterviewValues }) {
  const mother = values.role === 'father'
  return (
    <>
      <div className={fieldsGrid}>
        <Field name="partnerEmployment" label={mother ? 'Rodzaj zatrudnienia matki' : 'Rodzaj zatrudnienia drugiego rodzica'} choices={[
          ['unknown', 'Nie wiem / wybierz'], ['employee', 'Umowa o pracę'],
          ['contractor', 'Umowa zlecenia'], ['self_employed', 'Działalność gospodarcza'],
          ['other', 'Inna sytuacja'],
        ]}
          explain="Dane drugiej osoby potrzebne, żeby policzyć jej część urlopu i zasiłku." />
        <YesNo name="partnerInsured" label="Czy ma ubezpieczenie chorobowe?"
          explain="Bez ubezpieczenia chorobowego druga osoba nie dostanie zasiłku. Zostaje jej sam urlop." />
        <Field name="partnerBasis" label="Miesięczna podstawa wymiaru w zł" inputMode="decimal"
          hint="Zostaw puste, jeśli jej nie znasz." />
      </div>
      <p className="text-sm text-muted-foreground">
        Te dane są potrzebne do podziału urlopu rodzicielskiego. Bez nich kalkulator policzy tylko
        Twoją część, a drugą pokaże jako wymiar bez kwoty.
      </p>
    </>
  )
}

export function PregnancyQuestions() {
  return (
    <>
      <YesNo name="sickness" label="Czy masz zwolnienie lekarskie w związku z ciążą?" />
      <YesNo name="rehabilitation" label="Czy chcesz sprawdzić świadczenie rehabilitacyjne?" />
    </>
  )
}

export function SicknessFields() {
  return (
    <div className={fieldsGrid}>
      <Field name="sickStart" label="Początek zwolnienia" type="date" />
      <Field name="sickEnd" label="Koniec zwolnienia" type="date" />
      <Field name="insuredDays" label="Dni ubezpieczenia przed zwolnieniem" inputMode="numeric" />
      <Field name="sicknessDaysUsed" label="Dni wykorzystanego okresu zasiłkowego" inputMode="numeric" />
      <YesNo name="waitingExempt" label="Czy dotyczy Cię wyjątek od okresu wyczekiwania?" />
    </div>
  )
}

export function SicknessHistoryFields({ values }: { values: InterviewValues }) {
  const [firstYear, lastYear] = sicknessYears(values)
  return (
    <div className={fieldsGrid}>
      {values.employmentEnded && (
        <>
          <YesNo name="sickInsured" label="Czy na początku zwolnienia obowiązywało ubezpieczenie chorobowe?" />
          <YesNo name="sickPostInsuranceExclusion" label="Czy zachodzi wyłączenie prawa po ustaniu ubezpieczenia?" />
        </>
      )}
      {values.employment === 'employee' && (
        <>
          <Field name="birthYear" label="Twój rok urodzenia" inputMode="numeric" />
          <Field name="employerPaidFirst" label={firstYear
            ? `Dni wynagrodzenia chorobowego przed zwolnieniem w ${firstYear} r.`
            : 'Dni wynagrodzenia chorobowego przed tym zwolnieniem'} inputMode="numeric" />
          {firstYear && lastYear && firstYear !== lastYear && (
            <Field name="employerPaidSecond" label={`Dni wynagrodzenia chorobowego wcześniej wykorzystane w ${lastYear} r.`} inputMode="numeric" />
          )}
        </>
      )}
    </div>
  )
}

export function RehabilitationFields() {
  return (
    <div className={fieldsGrid}>
      <Field name="rehabStart" label="Początek okresu świadczenia rehabilitacyjnego" type="date" />
      <Field name="rehabDays" label="Liczba dni świadczenia rehabilitacyjnego" inputMode="numeric" />
      <YesNo name="sicknessExhausted" label="Czy okres zasiłkowy został wyczerpany?" />
      <YesNo name="stillUnable" label="Czy nadal trwa niezdolność do pracy?" />
      <YesNo name="favourableRuling" label="Czy orzeczenie potwierdza szansę odzyskania zdolności do pracy?" />
      <YesNo name="rehabExclusion" label="Czy zachodzi przesłanka wyłączenia, np. prawo do emerytury?" />
    </div>
  )
}

export function RehabilitationPaymentFields({ values }: { values: InterviewValues }) {
  return (
    <div className={fieldsGrid}>
      {values.employmentEnded && (
        <>
          <YesNo name="rehabInsured" label="Czy na początku tego okresu obowiązywało ubezpieczenie chorobowe?" />
          <YesNo name="rehabPostInsurance" label="Czy potwierdzono prawo po ustaniu ubezpieczenia?" />
        </>
      )}
      <Check name="rehabInPregnancy" label="Niezdolność przypada w ciąży" />
      <Field name="rehabIndexation" label="Mnożnik waloryzacji podstawy" inputMode="decimal" hint="Opcjonalnie, np. 1,10." />
    </div>
  )
}
