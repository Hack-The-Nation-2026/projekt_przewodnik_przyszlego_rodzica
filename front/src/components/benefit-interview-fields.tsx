import { useFieldArray, useFormContext } from 'react-hook-form'
import type { FieldPath } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { activeChildren, isPlacement, sicknessYears } from '@/lib/interview-form'
import type { InterviewValues } from '@/lib/interview-form'

type Choice = readonly [value: string, label: string]

const answers = [['unknown', 'Nie wiem'], ['yes', 'Tak'], ['no', 'Nie']] as const
const selectClass = 'h-10 w-full rounded-md border border-input bg-background px-3 text-base shadow-sm'
const fieldsGrid = 'grid gap-5 sm:grid-cols-2'

function Field({
  name,
  label,
  type = 'text',
  choices,
  hint,
  inputMode,
}: {
  name: FieldPath<InterviewValues>
  label: string
  type?: 'text' | 'date'
  choices?: readonly Choice[]
  hint?: string
  inputMode?: 'decimal' | 'numeric'
}) {
  const { control } = useFormContext<InterviewValues>()
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {choices ? (
              <select {...field} value={String(field.value)} className={selectClass}>
                {choices.map(([value, title]) => <option key={value} value={value}>{title}</option>)}
              </select>
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

function YesNo({ name, label, hint }: { name: FieldPath<InterviewValues>; label: string; hint?: string }) {
  return <Field name={name} label={label} choices={answers} hint={hint} />
}

function Check({ name, label }: { name: FieldPath<InterviewValues>; label: string }) {
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

export function FamilyFields({ values }: { values: InterviewValues }) {
  const placement = isPlacement(values)
  const children = activeChildren(values)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Twoja sytuacja rodzinna</CardTitle>
        <CardDescription>Wybierz swoją rolę i podaj datę, od której mamy zacząć.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className={fieldsGrid}>
          <Field name="role" label="Twoja rola" choices={[
            ['mother', 'Matka dziecka'], ['father', 'Ojciec dziecka'],
            ['adoption', 'Rodzic adopcyjny'], ['foster', 'Rodzic zastępczy'],
          ]} />
          {!placement && <Field name="birthStage" label="Etap rodzicielstwa" choices={[
            ['expected', 'Spodziewamy się dziecka'], ['born', 'Dziecko już się urodziło'],
          ]} />}
          <Field
            name="eventDate"
            label={placement ? 'Data przyjęcia dziecka na wychowanie'
              : values.birthStage === 'expected' ? 'Przewidywana data porodu' : 'Data porodu'}
            type="date"
          />
          <Field name="childCount" label="Liczba dzieci przy tym zdarzeniu" inputMode="numeric" />
        </div>
        {placement && <YesNo name="placementConfirmed" label={values.role === 'adoption'
          ? 'Czy złożono w sądzie wniosek o przysposobienie?' : 'Czy sprawujesz niezawodową pieczę zastępczą?'} />}
        {values.role === 'adoption' && <YesNo name="adoptiveFather" label="Czy jesteś ojcem adopcyjnym?" />}
        {values.role === 'adoption' && values.adoptiveFather === 'yes' && (
          <Field name="adoptionOrderDate" label="Data uprawomocnienia przysposobienia" type="date" />
        )}
        {values.role === 'father' && (
          <YesNo name="takingOver" label="Czy przejmujesz opiekę i pozostały macierzyński od matki?" />
        )}
        {values.role === 'father' && values.takingOver === 'yes' && (
          <Field name="takeoverDate" label="Data przejęcia macierzyńskiego" type="date" />
        )}
        <Check name="zaZyciem" label="Dziecko ma zaświadczenie „Za życiem”" />
        <YesNo name="hospitalization" label="Czy dziecko wymagało pobytu w szpitalu po urodzeniu lub przyjęciu?" />
        {values.hospitalization === 'yes' && (
          <Field name="pregnancyWeeks" label="Ukończony tydzień ciąży w chwili porodu" inputMode="numeric" hint="Podaj, jeśli go znasz." />
        )}
        {(placement || values.hospitalization === 'yes') && children.map((_, index) => (
          <ChildFields key={index} index={index} values={values} multiple={children.length > 1} />
        ))}
      </CardContent>
    </Card>
  )
}

export function EmploymentFields({ values }: { values: InterviewValues }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Praca i ubezpieczenie</CardTitle>
        <CardDescription>Jeśli brakuje danych, wynik wskaże, co jeszcze trzeba potwierdzić.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className={fieldsGrid}>
          <Field name="employment" label="Rodzaj zatrudnienia" choices={[
            ['unknown', 'Nie wiem / wybierz'], ['employee', 'Umowa o pracę'],
            ['contractor', 'Umowa zlecenia'], ['self_employed', 'Działalność gospodarcza'],
            ['other', 'Inna sytuacja'],
          ]} />
          <YesNo name="insured" label="Czy w dniu powstania prawa masz ubezpieczenie chorobowe?" />
          <Field name="basis" label="Miesięczna podstawa wymiaru w zł" inputMode="decimal"
            hint="Jeśli znasz podstawę używaną do wyliczenia zasiłku, wpisz ją tutaj." />
          {values.employment === 'self_employed' && (
            <YesNo name="arrears" label="Czy zaległość składkowa przekracza próg uwzględniany przez ZUS?" />
          )}
        </div>
        <Check name="employmentEnded" label="Zatrudnienie ustało lub jest znana data jego zakończenia" />
        {values.employmentEnded && (
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
        )}
        {values.employment === 'employee' && (
          <Check name="workingOnLeave" label="Chcę łączyć urlop rodzicielski z pracą u tego samego pracodawcy" />
        )}
        <div className={fieldsGrid}>
          <Field name="returnDate" type="date" label="Planowana data powrotu do pracy"
            hint={values.workingOnLeave && values.employment === 'employee'
              ? 'Podaj datę rozpoczęcia łączenia pracy z rodzicielskim.' : 'Opcjonalnie, do podsumowania.'} />
          {values.workingOnLeave && values.employment === 'employee' && (
            <>
              <Field name="workPercent" label="Praca na urlopie w % pełnego etatu" inputMode="decimal" hint="Maksymalnie 50%." />
              <Field name="contractedPercent" label="Wymiar pracy na umowie w % pełnego etatu" inputMode="decimal" />
              <Field name="parentalDays" label="Dni rodzicielskiego w części łączonej z pracą" inputMode="numeric"
                hint="Podaj liczbę dni przed wydłużeniem urlopu." />
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function PregnancyFields({ values }: { values: InterviewValues }) {
  const [firstYear, lastYear] = sicknessYears(values)
  return (
    <Card>
      <CardHeader>
        <CardTitle>Świadczenia w ciąży</CardTitle>
        <CardDescription>Uzupełnij szczegóły tylko przy świadczeniach, które chcesz sprawdzić.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <YesNo name="sickness" label="Czy masz zwolnienie lekarskie w związku z ciążą?" />
        {values.sickness === 'yes' && (
          <div className={fieldsGrid}>
            <Field name="sickStart" label="Początek zwolnienia" type="date" />
            <Field name="sickEnd" label="Koniec zwolnienia" type="date" />
            <Field name="insuredDays" label="Dni ubezpieczenia przed zwolnieniem" inputMode="numeric" />
            <Field name="sicknessDaysUsed" label="Dni wykorzystanego okresu zasiłkowego" inputMode="numeric" />
            <YesNo name="waitingExempt" label="Czy dotyczy Cię wyjątek od okresu wyczekiwania?" />
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
        )}

        <YesNo name="rehabilitation" label="Czy chcesz sprawdzić świadczenie rehabilitacyjne?" />
        {values.rehabilitation === 'yes' && (
          <div className={fieldsGrid}>
            <Field name="rehabStart" label="Początek okresu świadczenia rehabilitacyjnego" type="date" />
            <Field name="rehabDays" label="Liczba dni świadczenia rehabilitacyjnego" inputMode="numeric" />
            <YesNo name="sicknessExhausted" label="Czy okres zasiłkowy został wyczerpany?" />
            <YesNo name="stillUnable" label="Czy nadal trwa niezdolność do pracy?" />
            <YesNo name="favourableRuling" label="Czy orzeczenie potwierdza szansę odzyskania zdolności do pracy?" />
            <YesNo name="rehabExclusion" label="Czy zachodzi przesłanka wyłączenia, np. prawo do emerytury?" />
            {values.employmentEnded && (
              <>
                <YesNo name="rehabInsured" label="Czy na początku tego okresu obowiązywało ubezpieczenie chorobowe?" />
                <YesNo name="rehabPostInsurance" label="Czy potwierdzono prawo po ustaniu ubezpieczenia?" />
              </>
            )}
            <Check name="rehabInPregnancy" label="Niezdolność przypada w ciąży" />
            <Field name="rehabIndexation" label="Mnożnik waloryzacji podstawy" inputMode="decimal" hint="Opcjonalnie, np. 1,10." />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
